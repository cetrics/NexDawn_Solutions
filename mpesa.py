# mpesa.py
import requests
from requests.auth import HTTPBasicAuth
import base64
from datetime import datetime

# --- M-Pesa Sandbox Credentials ---
CONSUMER_KEY = "l0eVmhcAIddJ0YkUfk3HM1rRmIQrKf1nvsWCfGsoIwUol7qg"
CONSUMER_SECRET = "RKERKaOAwyThMDw9d2ASUK1SSng1qVsYSSw66n7D1kTGp8Ml4xGLaN2UA0f2GGsE"
BUSINESS_SHORTCODE = "174379"
PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"

# --- In-memory transaction store ---
transaction_status = {}

# --- Get Access Token ---
def get_access_token():
    url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    response = requests.get(url, auth=HTTPBasicAuth(CONSUMER_KEY, CONSUMER_SECRET), verify=False)
    return response.json().get("access_token")

# --- STK Push Request ---
def lipa_na_mpesa_online(phone_number, amount, callback_url):
    access_token = get_access_token()
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    password = base64.b64encode((BUSINESS_SHORTCODE + PASSKEY + timestamp).encode()).decode()

    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }

    payload = {
        "BusinessShortCode": BUSINESS_SHORTCODE,
        "Password": password,
        "Timestamp": timestamp,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone_number,
        "PartyB": BUSINESS_SHORTCODE,
        "PhoneNumber": phone_number,
        "CallBackURL": callback_url,
        "AccountReference": "Test123",
        "TransactionDesc": "Payment for Test"
    }

    response = requests.post(
        "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
        headers=headers,
        json=payload
    )

    return response.json()
