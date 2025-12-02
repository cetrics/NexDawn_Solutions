from flask import Flask, render_template, url_for
import os
import mysql.connector
from mysql.connector import Error
from mysql.connector import pooling
from flask import jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
import time
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
        cursor.execute("""
            SELECT id, username, email, password, phone, first_name,
                   last_name, user_type
            FROM users WHERE email = %s
        """, (email,))
        user = cursor.fetchone()

        if not user or not check_password_hash(user["password"], password):
            return jsonify({"success": False, "message": "Invalid email or password"}), 401

        # ONE TOKEN ONLY 🎯
        access_token = create_access_token(
            identity=str(user["id"]),
            additional_claims={
                "email": user["email"],
                "phone": user.get("phone", ""),
                "username": user.get("username", ""),
                "first_name": user.get("first_name", ""),
                "last_name": user.get("last_name", ""),
                "user_type": user["user_type"]  # ⭐ ADD THIS
            }
        )

        del user["password"]

        return jsonify({
            "success": True,
            "message": "Login successful",
            "token": access_token,
            "user": user,
        }), 200

    except Exception as e:
        print("Login error:", e)
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
        
        # Get search parameter from query string
        search = request.args.get('search', '')
        
        # Base query
        base_query = """
            SELECT p.id, p.name, p.description, p.price, p.discount, p.stock_quantity, 
                   p.image_url, p.category_id, p.brand, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
        """
        
        # Add WHERE clause if search parameter is provided
        if search:
            base_query += """
                WHERE p.name LIKE %s 
                OR p.description LIKE %s 
                OR p.brand LIKE %s 
                OR c.name LIKE %s
            """
            search_term = f"%{search}%"
            cursor.execute(base_query, (search_term, search_term, search_term, search_term))
        else:
            cursor.execute(base_query)
            
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


@app.route("/api/products/<int:product_id>", methods=["GET"])
def get_product_by_id(product_id):
    """Get a single product by ID with all details except stock"""
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)
        
        # Get product basic info - EXCLUDING stock_quantity for regular users
        # Check if user is admin (you can add your admin check logic here)
        # For now, let's exclude stock_quantity for all users
        cursor.execute("""
            SELECT p.id, p.name, p.description, p.price, p.discount, 
                   p.image_url, p.category_id, p.brand, c.name AS category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = %s
        """, (product_id,))
        
        product = cursor.fetchone()
        
        if not product:
            return jsonify({"error": "Product not found"}), 404

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
        
        # If you want to include stock for admins only, you can add this:
        # For now, we're excluding it completely as requested
        
        return jsonify(product), 200

    except Exception as e:
        print(f"❌ Error fetching product {product_id}:", e)
        return jsonify({"error": "An error occurred while retrieving product"}), 500

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
    """Add a new address - get user_id from request body"""
    try:
        # Get request body
        data = request.get_json()
        
        # Debug: Log the received data
        print(f"Received address data: {data}")

        # Validate required fields including user_id
        required_fields = ["user_id", "contact_name", "contact_phone", "address_line1", "town", "county", "postal_code", "country"]
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return jsonify({
                "error": "Missing required fields", 
                "missing_fields": missing_fields
            }), 422

        user_id = data["user_id"]

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor()

        # Insert the address with user_id from request body
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

        print(f"✅ Address added successfully for user {user_id}, address_id: {new_id}")
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

        # Insert into orders table - ADD 'new' for notification column
        cursor.execute(
            """
            INSERT INTO orders (user_id, address_id, payment_method, total_amount, status, created_at, order_number, notification)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (user_id, address_id, payment_method, total_amount, "Pending", datetime.now(), order_number, "new")  # ADDED 'new' HERE
        )
        order_id = cursor.lastrowid
        print(f"✅ Order created with ID: {order_id}")

        # ✅ Insert default tracking step (Ordered)
        cursor.execute(
            """
            INSERT INTO order_tracking (order_id, status, update_time, description)
            VALUES (%s, %s, %s, %s)
            """,
            (order_id, "Ordered", datetime.now(), "Order placed successfully")
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

@app.route("/api/categories/with-products", methods=["GET"])
def get_categories_with_products():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        # Get categories that have at least one product
        cursor.execute("""
            SELECT DISTINCT c.id, c.name, COUNT(p.id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id
            GROUP BY c.id, c.name
            HAVING COUNT(p.id) > 0
            ORDER BY c.name ASC
        """)
        categories = cursor.fetchall()
        return jsonify(categories), 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"error": "Server error"}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/reviews/product/<int:product_id>", methods=["GET"])
def get_reviews_by_product(product_id):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500
    try:
        cursor = conn.cursor(dictionary=True)
        
        # Simplified query - only get what we need for star ratings
        cursor.execute("""
            SELECT rating
            FROM reviews 
            WHERE product_id = %s
        """, (product_id,))
        reviews = cursor.fetchall()
        
        # Calculate average rating and count
        cursor.execute("""
            SELECT AVG(rating) as average_rating, COUNT(*) as review_count
            FROM reviews 
            WHERE product_id = %s
        """, (product_id,))
        stats = cursor.fetchone()
        
        return jsonify({
            "average_rating": float(stats['average_rating']) if stats['average_rating'] else 0,
            "review_count": stats['review_count'] or 0
        }), 200
    except Exception as e:
        print(f"❌ Error fetching reviews: {e}")
        return jsonify({"error": "Server error"}), 500
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

@app.route("/api/reviews", methods=["POST"])
def submit_review():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 422

    # Validate required fields
    required_fields = ["user_id", "product_id", "order_number", "rating"]
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing required field: {field}"}), 400

    # Validate and convert data
    try:
        user_id = int(data["user_id"])
        product_id = int(data["product_id"])
        rating = int(data["rating"])
        order_number = str(data["order_number"])  # this is now the FK
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid data types provided"}), 422

    # Validate rating
    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be between 1 and 5"}), 422

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Check if review already exists
        cursor.execute("""
            SELECT id FROM reviews 
            WHERE user_id = %s AND product_id = %s AND order_number = %s
        """, (user_id, product_id, order_number))
        
        existing_review = cursor.fetchone()

        if existing_review:
            return jsonify({"error": "You have already reviewed this product from this order"}), 409

        # Insert review
        cursor.execute("""
            INSERT INTO reviews (user_id, product_id, order_number, rating, comment)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_id,
            product_id,
            order_number,
            rating,
            data.get("comment")
        ))

        conn.commit()
        return jsonify({"message": "Review submitted successfully"}), 201

    except Exception as e:
        print(f"❌ Error submitting review: {e}")
        conn.rollback()
        return jsonify({"error": "Server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/reviews/order/<order_number>", methods=["GET"])
def check_order_review(order_number):
    user_id = request.args.get("user_id")

    if not user_id:
        return jsonify({"error": "Missing user_id parameter"}), 400

    try:
        user_id = int(user_id)
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid user_id"}), 422

    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT COUNT(*) AS review_count 
            FROM reviews 
            WHERE user_id = %s AND order_number = %s
        """, (user_id, order_number))

        result = cursor.fetchone()

        return jsonify({
            "has_reviewed": result["review_count"] > 0 if result else False
        }), 200

    except Exception as e:
        print(f"❌ Error checking review: {e}")
        return jsonify({"error": "Server error"}), 500

    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()


@app.route("/api/register", methods=["POST"])
def register():
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500

    try:
        data = request.get_json()
        
        # Required fields
        email = data.get("email")
        username = data.get("username")
        password = data.get("password")
        
        if not email or not username or not password:
            return jsonify({"success": False, "message": "Email, username, and password are required"}), 400

        # Check if user already exists
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id FROM users WHERE email = %s OR username = %s", (email, username))
        existing_user = cursor.fetchone()
        
        if existing_user:
            return jsonify({"success": False, "message": "User with this email or username already exists"}), 409

        # Hash password
        hashed_password = generate_password_hash(password)

        # Insert new user
        cursor.execute("""
            INSERT INTO users (
                email, username, password, first_name, last_name, 
                phone, id_number, date_of_birth, gender, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        """, (
            email,
            username,
            hashed_password,
            data.get("first_name", ""),
            data.get("last_name", ""),
            data.get("phone", ""),
            data.get("id_number", ""),
            data.get("date_of_birth"),
            data.get("gender", "")
        ))

        conn.commit()

        # Get the newly created user
        cursor.execute("""
            SELECT id, username, email, phone, first_name, last_name 
            FROM users WHERE id = LAST_INSERT_ID()
        """)
        new_user = cursor.fetchone()

        # Generate JWT token
        access_token = create_access_token(
            identity=str(new_user["id"]),
            additional_claims={
                "email": new_user["email"],
                "phone": new_user["phone"] if new_user["phone"] else "",
                "username": new_user["username"],
                "first_name": new_user["first_name"] if new_user["first_name"] else "",
                "last_name": new_user["last_name"] if new_user["last_name"] else ""
            }
        )

        return jsonify({
            "success": True,
            "message": "Registration successful",
            "token": access_token,
            "user": new_user
        }), 201

    except Exception as e:
        print(f"❌ Registration error: {e}")
        conn.rollback()
        return jsonify({"success": False, "message": "Internal server error"}), 500

    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()

# Contact form endpoint
@app.route('/api/contact', methods=['POST'])
def submit_contact():
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        message = data.get('message', '').strip()

        if not name or not email or not message:
            return jsonify({
                'success': False,
                'message': 'All fields are required'
            }), 400

        # Get database connection
        conn = get_db_connection()
        if not conn:
            return jsonify({
                'success': False,
                'message': 'Database connection failed'
            }), 500

        cursor = conn.cursor()
        
        # Insert contact message
        sql = "INSERT INTO contact_message (name, email, message) VALUES (%s, %s, %s)"
        cursor.execute(sql, (name, email, message))
        conn.commit()

        message_id = cursor.lastrowid
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Message sent successfully!',
            'id': message_id
        }), 201

    except mysql.connector.Error as db_err:
        print(f"Database error: {db_err}")
        return jsonify({
            'success': False,
            'message': 'Failed to save message to database'
        }), 500
        
    except Exception as e:
        print(f"Server error: {e}")
        return jsonify({
            'success': False,
            'message': 'Internal server error'
        }), 500

# Optional: Get all messages (for admin)
@app.route('/api/contact/messages', methods=['GET'])
def get_messages():
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'message': 'Database connection failed'}), 500

        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM contact_message ORDER BY created_at DESC")
        messages = cursor.fetchall()
        
        cursor.close()
        conn.close()

        return jsonify({
            'success': True,
            'messages': messages
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': 'Failed to fetch messages'}), 500


@app.route("/api/admin/orders")
def get_all_orders():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Get all orders with user information including delivery address details
        cursor.execute("""
            SELECT 
                o.id,
                o.order_number,
                o.total_amount,
                o.payment_method,
                o.status,
                o.created_at,
                u.email as user_email,
                u.first_name,
                u.last_name,
                u.phone,
                da.contact_name,
                da.contact_phone,
                da.address_line1,
                da.address_line2,
                da.town,
                da.county,
                da.postal_code,
                da.country,
                (
                    SELECT GROUP_CONCAT(CONCAT(p.name, ' x', oi.quantity) SEPARATOR ', ')
                    FROM order_items oi
                    JOIN products p ON p.id = oi.product_id
                    WHERE oi.order_id = o.id
                ) AS items_summary
            FROM orders o
            LEFT JOIN users u ON u.id = o.user_id
            LEFT JOIN delivery_addresses da ON da.address_id = o.address_id
            ORDER BY o.created_at DESC
        """)
        orders = cursor.fetchall()

        # Get order items with images
        order_ids = [o["id"] for o in orders]
        if order_ids:
            placeholders = ",".join(["%s"] * len(order_ids))
            cursor.execute(f"""
                SELECT 
                    oi.order_id,
                    p.id AS product_id,
                    p.name AS title,
                    p.price,
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
            """, order_ids)
            rows = cursor.fetchall()

            by_order = defaultdict(list)
            for r in rows:
                img_file = r.get("image_filename")
                image_url = url_for("static", filename=f"uploads/{img_file}") if img_file else None
                by_order[r["order_id"]].append({
                    "product_id": r["product_id"],
                    "title": r["title"],
                    "price": float(r["price"]) if r["price"] else 0,
                    "quantity": r["quantity"],
                    "image": image_url,
                })

        # Convert timezone and attach items
        nairobi_tz = pytz.timezone("Africa/Nairobi")
        for o in orders:
            if isinstance(o["created_at"], datetime):
                o["created_at"] = o["created_at"].astimezone(nairobi_tz).isoformat()
            o["items"] = by_order.get(o["id"], [])
            o.pop("id", None)

        return jsonify(orders)

    except Error as e:
        print(f"Database error: {str(e)}")
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/orders/<order_number>/status", methods=["PUT"])
def update_order_status(order_number):
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if not new_status:
            return jsonify({"error": "Status is required"}), 400

        cursor = conn.cursor()
        cursor.execute(
            "UPDATE orders SET status = %s WHERE order_number = %s",
            (new_status, order_number)
        )
        conn.commit()

        return jsonify({"message": "Order status updated successfully"})

    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route("/api/admin/customers")
def get_all_customers():
    conn = get_db_connection()
    if conn is None:
        return jsonify({"error": "DB connection failed"}), 500

    try:
        cursor = conn.cursor(dictionary=True)

        # Get all customers with order counts
        cursor.execute("""
            SELECT 
                u.id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.phone,
                u.id_number,
                u.date_of_birth,
                u.gender,
                u.created_at,
                u.updated_at,
                u.last_login,
                COUNT(o.id) as order_count
            FROM users u
            LEFT JOIN orders o ON u.id = o.user_id
            GROUP BY u.id
            ORDER BY u.created_at DESC
        """)
        customers = cursor.fetchall()

        # Convert datetime to string for JSON serialization
        for customer in customers:
            if customer['created_at']:
                customer['created_at'] = customer['created_at'].isoformat()
            if customer['updated_at']:
                customer['updated_at'] = customer['updated_at'].isoformat()
            if customer['last_login']:
                customer['last_login'] = customer['last_login'].isoformat()
            if customer['date_of_birth']:
                customer['date_of_birth'] = customer['date_of_birth'].isoformat()

        return jsonify(customers)

    except Error as e:
        return jsonify({"error": str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@app.route("/api/admin/orders/<order_number>/clear-notification", methods=["POST"])
def clear_notification(order_number):
    """Clear notification for an order"""
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500
        
        cursor = conn.cursor()
        
        # Update notification to NULL
        cursor.execute(
            "UPDATE orders SET notification = NULL WHERE order_number = %s",
            (order_number,)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({"success": True, "message": "Notification cleared"}), 200
        
    except Exception as e:
        print(f"Error clearing notification: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/admin/orders/new", methods=["GET"])
def get_new_orders():
    """Get orders that have notification = 'new'"""
    try:
        conn = get_db_connection()
        if conn is None:
            return jsonify({"error": "Database connection failed"}), 500

        cursor = conn.cursor(dictionary=True)

        # Fetch all orders with notification = 'new'
        cursor.execute("""
            SELECT id, order_number, user_id, address_id, payment_method,
                   total_amount, status, created_at, updated_at, notification
            FROM orders
            WHERE LOWER(notification) = 'new'
            ORDER BY created_at DESC
        """)

        orders = cursor.fetchall()
        cursor.close()
        conn.close()

        return jsonify({
            "orders": orders,
            "count": len(orders)
        }), 200

    except Exception as e:
        print(f"Error fetching new orders: {str(e)}")
        return jsonify({"error": str(e)}), 500


    
if __name__ == "__main__":
    app.run(debug=True)

