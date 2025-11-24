from flask import Flask, render_template, url_for
import os
import mysql.connector
from mysql.connector import Error
from mysql.connector import pooling
from flask import jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime, timedelta
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from functools import wraps
from flask_mail import Mail, Message
import secrets
from mpesa import lipa_na_mpesa_online, transaction_status
import random
from collections import defaultdict
from pyngrok import ngrok
import pytz

app = Flask(__name__)
CORS(app)  # Add this line

#  Generate a proper secret key
app.config["JWT_SECRET_KEY"] = secrets.token_urlsafe(32)  # Secure random key
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)
app.config["JWT_ALGORITHM"] = "HS256"

jwt = JWTManager(app)
transaction_status = {}

# Configure Flask-Mail for cPanel email
app.config["MAIL_SERVER"] = "mail.peakersdesign.co.ke"
app.config["MAIL_PORT"] = 465
app.config["MAIL_USE_SSL"] = True
app.config["MAIL_USERNAME"] = "info@peakersdesign.co.ke"
app.config["MAIL_PASSWORD"] = "hH-9-O[kT1W@R2o}"
app.config["MAIL_DEFAULT_SENDER"] = ("Peakers Design", "info@peakersdesign.co.ke")

mail = Mail(app)

password_reset_tokens = {}

app.config['SECRET_KEY'] = 'your-secret-key-here'
# Correct path for upload folder: static/uploads
UPLOAD_FOLDER = os.path.join(app.static_folder, "uploads")
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# Ensure the folder exists at startup
os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

# File size limit (5MB)
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

# Allowed file extensions
ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "gif"}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


#  MySQL Configuration
mysql_settings = {
    "host": os.environ.get("DB_HOST", "localhost"),
    "user": os.environ.get("DB_USER", "root"),
    "password": os.environ.get("DB_PASSWORD", ""),
    "database": os.environ.get("DB_NAME", "next_dawn"),
}

pool = None  # Global connection pool


def create_pool():
    """Create a new pool safely"""
    global pool
    try:
        pool = pooling.MySQLConnectionPool(
            pool_name="mypool",
            pool_size=5,
            **mysql_settings
        )
        print("Connection pool created successfully")
    except mysql.connector.Error as err:
        print(f" Failed to create connection pool: {err}")
        pool = None


def get_db_connection(retries=3, delay=2):
    """Get a connection, recreate pool if DB was down and restarted"""
    global pool
    for attempt in range(retries):
        try:
            if pool is None:
                print(" No pool available, recreating...")
                create_pool()

            if pool is not None:
                conn = pool.get_connection()
                conn.ping(reconnect=True, attempts=3, delay=2)
                if conn.is_connected():
                    print(" Successfully acquired connection")
                    return conn

        except (mysql.connector.Error, mysql.connector.errors.PoolError) as err:
            print(f" Connection failed (attempt {attempt+1}/{retries}): {err}")
            pool = None  # Reset so next loop recreates
            time.sleep(delay)

    print(" All retries failed, returning None")
    return None


@app.route("/")
@app.route("/<path:path>")
def index(path=None):
    return render_template("index.html")

@app.route("/api/debug-token", methods=["GET"])
@jwt_required()
def debug_token():
    try:
        user_id = get_jwt_identity()
        return jsonify({
            "user_id": user_id,
            "message": "Token is valid",
            "token_type": "JWT"
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 401   

@app.route("/api/forgot-password", methods=["POST"])
def forgot_password():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        data = request.get_json()
        email = data.get("email")

        if not email:
            return jsonify({"success": False, "message": "Email is required"}), 400

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            return jsonify({"success": False, "message": "No account found for this email"}), 404

        # Generate unique reset token
        token = secrets.token_urlsafe(32)
        password_reset_tokens[token] = user["id"]

        #  Replace with your actual frontend domain
        reset_link = f"http://127.0.0.1:5000/reset-password?token={token}"

        #  Beautiful HTML Email (purple theme)
        html_message = f"""
        <div style="font-family: Arial, sans-serif; color: #333; max-width:600px; margin:auto; padding:20px; border-radius:10px; border:1px solid #eee;">
          <h2 style="color:#7c3aed;">Password Reset Request</h2>
          <p>Hi {user['name']},</p>
          <p>We received a request to reset your password. Click the button below to proceed:</p>

          <p style="text-align:center; margin:24px 0;">
            <a href="{reset_link}" target="_blank"
              style="display:inline-block; background-color:#8b5cf6; color:white; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:bold;">
              Reset Password
            </a>
          </p>

          <p>If the button doesn’t work, copy and paste this link into your browser:</p>
          <p><a href="{reset_link}" style="color:#7c3aed;">{reset_link}</a></p>

          <br>
          <p>If you didn’t request a password reset, you can safely ignore this email.</p>
          <p style="color:#7c3aed; font-weight:bold;">– Peakers Design Team</p>
        </div>
        """

        #  Send the email
        msg = Message(
            subject="Reset Your Password – Peakers Design",
            recipients=[email],
            html=html_message,
        )
        mail.send(msg)

        return jsonify({"success": True, "message": "Password reset link sent to your email."}), 200

    except Exception as e:
        print(f" Forgot password error: {e}")
        return jsonify({"success": False, "message": "Error sending reset link."}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

#  LOGIN route
@app.route("/api/login", methods=["POST"])
def login():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"success": False, "message": "Email and password required"}), 400

        cursor = conn.cursor(dictionary=True)
        # ✅ SELECT phone and other fields you need
        cursor.execute("SELECT id, username, email, password, phone, first_name, last_name FROM users WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user or not check_password_hash(user["password"], password):
            return jsonify({"success": False, "message": "Invalid email or password"}), 401

        # ✅ Generate JWT token with phone and other user data
        access_token = create_access_token(
            identity=str(user["id"]),
            additional_claims={
                "email": user["email"],
                "phone": user["phone"] if user["phone"] else "",  # ✅ Include phone
                "username": user["username"] if user["username"] else "",
                "first_name": user["first_name"] if user["first_name"] else "",
                "last_name": user["last_name"] if user["last_name"] else ""
            }
        )

        # Remove password before sending user data
        del user["password"]

        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": access_token,
            "user": user,  # This also includes phone now
        }), 200

    except Exception as e:
        print(f" Login error: {e}")
        return jsonify({"success": False, "message": "Internal server error"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


@app.route("/api/reset-password", methods=["POST"])
def reset_password():
    conn = get_db_connection()
    cursor = None  # ensure cursor is defined
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        data = request.get_json()
        token = data.get("token")
        new_password = data.get("password")

        if not token or not new_password:
            return jsonify({"success": False, "message": "Token and password required"}), 400

        #  Ensure token exists
        if token not in password_reset_tokens:
            return jsonify({"success": False, "message": "Invalid or expired token"}), 400

        user_id = password_reset_tokens.pop(token)
        hashed_password = generate_password_hash(new_password)

        cursor = conn.cursor()
        cursor.execute("UPDATE users SET password = %s WHERE id = %s", (hashed_password, user_id))
        conn.commit()

        return jsonify({"success": True, "message": "Password reset successful. You can now log in."}), 200

    except Exception as e:
        print(f" Reset password error: {e}")
        return jsonify({"success": False, "message": "Error resetting password."}), 500

    finally:
        #  only close cursor if it exists
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()

@app.route("/api/user-info", methods=["GET"])
@jwt_required()
def get_user_info():
    try:
        user_id = get_jwt_identity()
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, email FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify(user), 200
    except Exception as e:
        print(" get_user_info error:", e)
        return jsonify({"error": "Token invalid or expired"}), 401
    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()

@app.route("/api/products", methods=["GET"])
def get_products():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # ✅ Add brand and description to the SELECT statement
        cursor.execute("""
            SELECT p.id, p.name, p.description, p.price, p.discount, p.stock_quantity, 
                   p.image_url, p.category_id, p.brand, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
        """)
        products = cursor.fetchall()

        for product in products:
            product_id = product["id"]

            # Fetch colors
            cursor.execute("""
                SELECT cl.color_id, cl.name 
                FROM product_colors pc
                JOIN colors cl ON pc.color_id = cl.color_id
                WHERE pc.product_id = %s
            """, (product_id,))
            product["colors"] = cursor.fetchall()

            # Fetch sizes
            cursor.execute("""
                SELECT s.size_id, s.size_name 
                FROM product_sizes ps
                JOIN sizes s ON ps.size_id = s.size_id
                WHERE ps.product_id = %s
            """, (product_id,))
            product["sizes"] = cursor.fetchall()

            # Fetch images
            cursor.execute("""
                SELECT image_filename 
                FROM product_images 
                WHERE product_id = %s
            """, (product_id,))
            product["images"] = [row["image_filename"] for row in cursor.fetchall()]

        return jsonify(products), 200

    except Exception as e:
        print("❌ Error fetching products:", e)
        return jsonify({"error": "An error occurred while retrieving products"}), 500

    finally:
        cursor.close()
        conn.close()



@app.route("/api/products", methods=["POST"])
def add_product():
    images = request.files.getlist("images")

    if not images or all(img.filename == '' for img in images):
        return jsonify({"error": "No images uploaded"}), 400

    saved_filenames = []

    # Process and save each image
    for image in images:
        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)

            try:
                image.save(image_path)
                saved_filenames.append(unique_filename)
            except Exception as e:
                return jsonify({"error": f"Failed to save image: {str(e)}"}), 500

    # Extract form data
    form_data = request.form
    name = form_data.get("name")
    description = form_data.get("description")
    price = form_data.get("price")
    category_id = form_data.get("category_id")
    brand = form_data.get("brand")
    stock_quantity = form_data.get("stock_quantity", 0)
    colors = form_data.getlist("colors")
    sizes = form_data.getlist("sizes")
    discount = form_data.get("discount")

    # Validate required fields (material removed)
    if not all([name, description, price, category_id, brand]):
        # Cleanup saved images
        for filename in saved_filenames:
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.exists(image_path):
                os.remove(image_path)
        return jsonify({"error": "Missing required fields"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        cursor = conn.cursor()
        discount = float(discount) if discount else None

        # Insert product (material removed)
        cursor.execute("""
            INSERT INTO products (
                name, description, price, category_id, brand, 
                stock_quantity, discount, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
        """, (name, description, price, category_id, brand,
              stock_quantity, discount))
        
        product_id = cursor.lastrowid

        # Insert product_images
        for filename in saved_filenames:
            cursor.execute("""
                INSERT INTO product_images (product_id, image_filename)
                VALUES (%s, %s)
            """, (product_id, filename))

        # Insert product_colors
        for color_id in colors:
            cursor.execute("""
                INSERT INTO product_colors (product_id, color_id) 
                VALUES (%s, %s)
            """, (product_id, int(color_id)))

        # Insert product_sizes
        for size in sizes:
            cursor.execute("""
                INSERT INTO product_sizes (product_id, size_id) 
                VALUES (%s, %s)
            """, (product_id, size))

        conn.commit()
        return jsonify({
            "message": "Product added successfully",
            "product_id": product_id,
            "image_filenames": saved_filenames
        }), 201

    except Exception as e:
        conn.rollback()
        print("❌ Error adding product:", e)
        # Cleanup saved images on failure
        for filename in saved_filenames:
            image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            if os.path.exists(image_path):
                os.remove(image_path)
        return jsonify({"error": "Server error: " + str(e)}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/products/<int:product_id>", methods=["PUT"])
def update_product(product_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    cursor = conn.cursor()
    cursor.execute("SELECT image_url FROM products WHERE id = %s", (product_id,))
    existing_product = cursor.fetchone()

    if not existing_product:
        cursor.close()
        conn.close()
        return jsonify({"error": "Product not found"}), 404

    old_image = existing_product[0]
    image = request.files.get('image')
    form_data = request.form

    name = form_data.get("name")
    description = form_data.get("description")
    price = form_data.get("price")
    category_id = form_data.get("category_id")
    brand = form_data.get("brand")
    stock_quantity = form_data.get("stock_quantity", 0)
    discount = form_data.get("discount")
    colors = form_data.getlist("colors")   # ✅ list of color IDs
    sizes = form_data.getlist("sizes")

    # ✅ Validate required fields (no material anymore)
    if not all([name, description, price, category_id, brand]):
        cursor.close()
        conn.close()
        return jsonify({"error": "Missing required fields"}), 400

    # Convert discount safely
    discount = float(discount) if discount else None

    image_filename = old_image

    # ✅ Handle new image upload
    if image and allowed_file(image.filename):
        filename = secure_filename(image.filename)
        unique_filename = f"{uuid.uuid4().hex}_{filename}"
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        try:
            image.save(image_path)
            image_filename = unique_filename

            # Delete old image file
            old_image_path = os.path.join(app.config['UPLOAD_FOLDER'], old_image)
            if old_image and os.path.exists(old_image_path):
                os.remove(old_image_path)
        except Exception as e:
            cursor.close()
            conn.close()
            return jsonify({"error": f"Image upload failed: {str(e)}"}), 500
    elif image:
        cursor.close()
        conn.close()
        return jsonify({"error": "Invalid image file type"}), 400

    try:
        # ✅ Update product (removed 'material')
        cursor.execute("""
            UPDATE products SET
                name=%s, description=%s, price=%s, category_id=%s, brand=%s,
                stock_quantity=%s, discount=%s, image_url=%s
            WHERE id=%s
        """, (
            name, description, price, category_id, brand,
            stock_quantity, discount, image_filename, product_id
        ))

        # ✅ Clear and re-insert product colors
        cursor.execute("DELETE FROM product_colors WHERE product_id = %s", (product_id,))
        for color_id in colors:
            cursor.execute("""
                INSERT INTO product_colors (product_id, color_id)
                VALUES (%s, %s)
            """, (product_id, int(color_id)))

        # ✅ Clear and re-insert product sizes
        cursor.execute("DELETE FROM product_sizes WHERE product_id = %s", (product_id,))
        for size_id in sizes:
            cursor.execute("""
                INSERT INTO product_sizes (product_id, size_id)
                VALUES (%s, %s)
            """, (product_id, int(size_id)))

        conn.commit()
        return jsonify({"message": "Product updated successfully"}), 200

    except Exception as e:
        conn.rollback()
        print("❌ Error updating product:", e)
        return jsonify({"error": "Server error"}), 500

    finally:
        cursor.close()
        conn.close()




@app.route("/api/products/<int:product_id>", methods=["DELETE"])
def delete_product(product_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        cursor = conn.cursor()
        
        # First delete colors and sizes
        cursor.execute("DELETE FROM product_colors WHERE product_id = %s", (product_id,))
        cursor.execute("DELETE FROM product_sizes WHERE product_id = %s", (product_id,))
        
        # Then delete the product
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        
        if cursor.rowcount == 0:
            return jsonify({"error": "Product not found"}), 404
            
        conn.commit()
        return jsonify({"message": "Product deleted successfully"}), 200
    except Exception as e:
        print("❌", e)
        conn.rollback()
        return jsonify({"error": "Server error"}), 500
    finally:
        cursor.close()
        conn.close()

# ---------------------- Colors Endpoints ----------------------

@app.route("/api/colors", methods=["GET"])
def get_colors():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT color_id, name FROM colors ORDER BY name ASC")
        return jsonify(cursor.fetchall()), 200
    finally:
        cursor.close()
        conn.close()





@app.route("/api/colors", methods=["POST"])
def add_color():
    data = request.get_json()
    color = data.get("color")

    if not color:
        return jsonify({"error": "Color is required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        cursor = conn.cursor()

        # Check if color already exists in the 'colors' table
        cursor.execute("SELECT * FROM colors WHERE name = %s", (color,))
        if cursor.fetchone():
            return jsonify({"error": "Color already exists"}), 409

        # Insert into the 'colors' table
        cursor.execute("INSERT INTO colors (name) VALUES (%s)", (color,))
        conn.commit()

        return jsonify({"message": "Color added", "id": cursor.lastrowid}), 201

    except Exception as e:
        print("❌", e)
        return jsonify({"error": "Server error"}), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name FROM categories ORDER BY name ASC")
        return jsonify(cursor.fetchall()), 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": "Server error"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/categories", methods=["POST"])
def add_category():
    data = request.get_json()
    name = data.get("name")

    if not name:
        return jsonify({"error": "Category name is required"}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        cursor = conn.cursor()

        # Check if category already exists
        cursor.execute("SELECT * FROM categories WHERE name = %s", (name,))
        if cursor.fetchone():
            return jsonify({"error": "Category already exists"}), 409

        # Insert new category
        cursor.execute("INSERT INTO categories (name, created_at) VALUES (%s, NOW())", (name,))
        conn.commit()

        return jsonify({"message": "Category added", "id": cursor.lastrowid}), 201

    except Exception as e:
        print("❌", e)
        return jsonify({"error": "Server error"}), 500

    finally:
        cursor.close()
        conn.close()

# ADDRESS ENDPOINTS

@app.route("/api/addresses/", methods=["POST"])
def add_address():
    """Add a new address - simplified without authentication"""
    try:
        # Get request body
        data = request.get_json()
        
        # Debug: Log the received data
        print(f"Received address data: {data}")

        # Validate required fields
        required_fields = ["contact_name", "contact_phone", "address_line1", "town", "county", "postal_code", "country"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": "Missing required fields", 
                "missing_fields": missing_fields
            }), 422

        # For demo purposes, using a default user_id
        # In a real app, you'd get this from session or request parameters
        user_id = data.get("user_id", 1)  # Default to user 1 for testing

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # Insert the address
        cursor.execute("""
            INSERT INTO delivery_addresses
            (user_id, address_type, contact_name, contact_phone, address_line1, 
             address_line2, town, county, postal_code, country, is_default, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            data.get("address_type", "Home"),
            data["contact_name"],
            data["contact_phone"],
            data["address_line1"],
            data.get("address_line2", ""),
            data["town"],
            data["county"],
            data["postal_code"],
            data["country"],
            data.get("is_default", False),
            datetime.now(),
            datetime.now(),
        ))

        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()

        print(f"✅ Address added successfully, address_id: {new_id}")
        return jsonify({
            "success": True,
            "message": "Address added successfully", 
            "address_id": new_id
        }), 201

    except Exception as e:
        print(f"❌ Error adding address: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route("/api/addresses/<int:user_id>", methods=["GET"])
def get_addresses(user_id):
    """Get all addresses for a user"""
    try:
        print(f"🔍 Fetching addresses for user_id: {user_id}")  # Debug log
        
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM delivery_addresses WHERE user_id = %s ORDER BY is_default DESC, created_at DESC", (user_id,))
        addresses = cursor.fetchall()
        
        cursor.close()
        conn.close()

        print(f"✅ Found {len(addresses)} addresses for user {user_id}")  # Debug log
        
        return jsonify({
            "success": True,
            "addresses": addresses
        }), 200

    except Exception as e:
        print(f"❌ Error fetching addresses: {str(e)}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# --- STK Push Endpoint ---
@app.route('/test-stkpush', methods=['POST'])
def test_stkpush():
    data = request.get_json()  # Accept JSON
    phone = data.get("phone")
    amount = data.get("amount")

    if not phone or not amount:
        return jsonify({"error": "Missing phone or amount"}), 400

    result = lipa_na_mpesa_online(phone, int(amount), app.config["CALLBACK_URL"])
    checkout_id = result.get("CheckoutRequestID")
    if checkout_id:
        transaction_status[checkout_id] = "Pending"
    return jsonify({"checkout_id": checkout_id})

# --- Callback Endpoint ---
@app.route('/callback', methods=['POST'])
def mpesa_callback():
    data = request.get_json()
    try:
        stk_callback = data['Body']['stkCallback']
        checkout_id = stk_callback['CheckoutRequestID']
        result_code = stk_callback['ResultCode']

        if result_code == 0:
            status = "Success"
        elif result_code == 1032:
            status = "Cancelled"
        else:
            status = "Failed"

        transaction_status[checkout_id] = status
        return jsonify({"result": "Callback handled"}), 200

    except Exception as e:
        print(f"❌ Error handling callback: {e}")
        return jsonify({"error": "Bad callback format"}), 400

# --- Check Status API ---
@app.route('/check-status/<checkout_id>')
def check_status(checkout_id):
    status = transaction_status.get(checkout_id, "Pending")
    return jsonify({"status": status})

# Ngrok setup for M-Pesa callbacks
public_url = ngrok.connect(5000).public_url
app.config["CALLBACK_URL"] = f"{public_url}/callback"
print(f"Ngrok URL: {public_url}")
print(f"Callback URL: {app.config['CALLBACK_URL']}")  


def generate_order_number():
    return str(random.randint(100000, 999999))  # 6-digit random number

@app.route("/api/orders", methods=["POST"])
def create_order():
    data = request.json
    print(f"📦 Received order data: {data}")  # Debug log
    
    user_id = data.get("user_id")
    address_id = data.get("address_id")
    payment_method = data.get("payment_method")
    total_amount = data.get("total_amount")
    cart_items = data.get("cart_items", [])

    print(f"🔍 Parsed fields - user_id: {user_id}, address_id: {address_id}, payment_method: {payment_method}, total_amount: {total_amount}, cart_items: {len(cart_items)}")

    if not user_id or not address_id or not payment_method or not total_amount:
        error_msg = f"Missing required fields: user_id={user_id}, address_id={address_id}, payment_method={payment_method}, total_amount={total_amount}"
        print(f"❌ {error_msg}")
        return jsonify({"error": "Missing required fields", "details": error_msg}), 400

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        cursor = conn.cursor()
        
        # ✅ Generate a unique order_number with retry
        max_attempts = 5
        for attempt in range(max_attempts):
            order_number = generate_order_number()
            cursor.execute("SELECT id FROM orders WHERE order_number = %s", (order_number,))
            if not cursor.fetchone():
                break
        else:
            return jsonify({"error": "Failed to generate unique order number"}), 500

        print(f"✅ Using order_number: {order_number}")

        # Insert into orders table - FIXED: use datetime.now() instead of datetime.datetime.now()
        cursor.execute(
            """
            INSERT INTO orders (user_id, address_id, payment_method, total_amount, status, created_at, order_number)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, address_id, payment_method, total_amount, "Pending", datetime.now(), order_number)  # FIXED HERE
        )
        order_id = cursor.lastrowid
        print(f"✅ Order created with ID: {order_id}")

        # ✅ Insert default tracking step (Ordered) - FIXED: use datetime.now()
        cursor.execute(
            """
            INSERT INTO order_tracking (order_id, status, update_time, description)
            VALUES (%s, %s, %s, %s)
            """,
            (order_id, "Ordered", datetime.now(), "Order placed successfully")  # FIXED HERE
        )

        # Insert each cart item into order_items and update stock
        for item in cart_items:
            print(f"📝 Adding item: {item}")
            cursor.execute(
                """
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES (%s, %s, %s, %s)
                """,
                (order_id, item["id"], item["quantity"], item["price"])
            )

            # ✅ Deduct stock from products table
            cursor.execute(
                """
                UPDATE products
                SET stock_quantity = stock_quantity - %s
                WHERE id = %s
                """,
                (item["quantity"], item["id"])
            )

        conn.commit()
        print(f"✅ Order {order_id} committed successfully")
        return jsonify({"success": True, "order_id": order_id, "order_number": order_number}), 201

    except Exception as e:
        conn.rollback()
        print(f"❌ Error creating order: {str(e)}")
        import traceback
        print(f"🔍 Stack trace: {traceback.format_exc()}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/api/orders/<int:user_id>")
def get_user_orders(user_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # 1) Get orders
        cursor.execute(
            """
            SELECT 
                o.id,
                o.order_number,
                o.total_amount,
                o.payment_method,
                o.status,
                o.created_at,
                (
                    SELECT GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR ', ')
                    FROM order_items oi
                    JOIN products p ON p.id = oi.product_id
                    WHERE oi.order_id = o.id
                ) AS items_summary
            FROM orders o
            WHERE o.user_id = %s
            ORDER BY o.created_at DESC
            """,
            (user_id,),
        )
        orders = cursor.fetchall()
        if not orders:
            return jsonify([])

        # 2) Fetch order items with first image
        order_ids = [o["id"] for o in orders]
        placeholders = ",".join(["%s"] * len(order_ids))
        cursor.execute(
            f"""
            SELECT 
                oi.order_id,
                p.id AS product_id,
                p.name AS title,
                oi.quantity,
                (
                    SELECT pi.image_filename
                    FROM product_images pi
                    WHERE pi.product_id = p.id
                    ORDER BY pi.id ASC
                    LIMIT 1
                ) AS image_filename
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id IN ({placeholders})
            ORDER BY oi.order_id, oi.id
            """,
            order_ids,
        )
        rows = cursor.fetchall()

        by_order = defaultdict(list)
        for r in rows:
            img_file = r.get("image_filename")
            image_url = url_for("static", filename=f"uploads/{img_file}") if img_file else None
            by_order[r["order_id"]].append({
                "product_id": r["product_id"],
                "title": r["title"],
                "quantity": r["quantity"],
                "image": image_url,
            })

        nairobi_tz = pytz.timezone("Africa/Nairobi")
        for o in orders:
            # ✅ CORRECT: Use just 'datetime' since you imported the class directly
            if isinstance(o["created_at"], datetime):
                o["created_at"] = o["created_at"].astimezone(nairobi_tz).isoformat()

            o["items"] = by_order.get(o["id"], [])
            o.pop("id", None)

        response = jsonify(orders)
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    app.run(debug=True)

