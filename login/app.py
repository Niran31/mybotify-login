"""
MyBotify Authentication Backend
Flask application with PostgreSQL database, JWT auth, and email verification
"""
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt
import os
import pandas as pd

import google.generativeai as genai
from dotenv import load_dotenv
import os


# Brevo (Sendinblue) Email API
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException

# Get DATABASE_URL from environment variable (Render sets this automatically)
DATABASE_URL = os.environ.get("DATABASE_URL")

# Fallback for local development if needed
if not DATABASE_URL:
    DATABASE_URL = "postgresql://mybotify_db_user:HYCww4RmBdps1sI7k4ZkqXRwcD6Fc6wN@dpg-d5nl6m1r0fns73fl2vr0-a.oregon-postgres.render.com/mybotify_db"

# Configure Brevo API
BREVO_API_KEY = os.environ.get("BREVO_API_KEY", "")
configuration = sib_api_v3_sdk.Configuration()
configuration.api_key['api-key'] = BREVO_API_KEY

import secrets
from functools import wraps
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.0-flash")


# React build folder path
REACT_BUILD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend', 'dist')

app = Flask(__name__, static_folder=None)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_EXPIRATION_HOURS'] = 24

# Email sender configuration
EMAIL_FROM = os.environ.get('EMAIL_FROM', 'niranjannivash0@gmail.com')
EMAIL_FROM_NAME = os.environ.get('EMAIL_FROM_NAME', 'MyBotify')


def send_otp_email(email, otp):
    """Send OTP verification email using Brevo API"""
    try:
        if not BREVO_API_KEY:
            print(f"⚠️ BREVO_API_KEY not set. OTP for {email}: {otp}")
            return True
        
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": email}],
            sender={"name": EMAIL_FROM_NAME, "email": EMAIL_FROM},
            subject="MyBotify Email Verification",
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #667eea;">MyBotify Email Verification</h2>
                <p>Hello,</p>
                <p>Your MyBotify verification OTP is:</p>
                <div style="background: #f4f4f4; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                    <h1 style="color: #667eea; margin: 0; letter-spacing: 8px;">{otp}</h1>
                </div>
                <p>This OTP is valid for <strong>10 minutes</strong>.</p>
                <p>If you did not sign up, please ignore this email.</p>
                <br>
                <p>Thanks,<br>MyBotify Team</p>
            </div>
            """
        )
        
        response = api_instance.send_transac_email(send_smtp_email)
        print(f"✅ OTP email sent to {email}: {response}")
        return True
    except ApiException as e:
        print(f"❌ OTP email failed: {e}")
        return False
    except Exception as e:
        print(f"❌ OTP email failed: {e}")
        return False



# Serve React App - Flask serves the React build for production and handles SPA routing
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    """Serve React app and static assets, supporting client-side routing"""
    if path.startswith('api/') or path.startswith('ai/'):
        return jsonify({'error': 'Not found'}), 404
        
    # Check if the requested path is a file in the React build directory
    file_path = os.path.join(REACT_BUILD_DIR, path)
    if path and os.path.exists(file_path) and os.path.isfile(file_path):
        return send_from_directory(REACT_BUILD_DIR, path)
        
    # Fallback to index.html for client-side routing (React Router)
    return send_from_directory(REACT_BUILD_DIR, 'index.html')


def get_db_connection():
    try:
        conn = psycopg2.connect(
            DATABASE_URL,
            sslmode="require"
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def init_database():
    """Initialize database tables"""
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cur = conn.cursor()
        
        # Create users table
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password_hash VARCHAR(255) NOT NULL,
                is_verified BOOLEAN DEFAULT FALSE,
                verification_token VARCHAR(255),
                reset_token VARCHAR(255),
                reset_token_expiry TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create pending_users table for OTP verification during signup
        cur.execute("""
            CREATE TABLE IF NOT EXISTS pending_users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                otp VARCHAR(6),
                otp_expiry TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        cur.close()
        conn.close()
        print("Database initialized successfully")
        return True
    except Exception as e:
        print(f"Database initialization error: {e}")
        if conn:
            conn.close()
        return False

# Initialize database tables on application start
try:
    init_database()
except Exception as db_err:
    print(f"⚠️ Could not initialize database on startup: {db_err}")

# Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'message': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

# Routes

# ================= SIGNUP – SEND OTP =================
@app.route("/api/signup", methods=["POST"])
def signup_send_otp():
    data = request.json
    name = data["name"]
    email = data["email"]
    phone = data["phone"]
    password = data["password"]

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500
    cur = conn.cursor()

    # Check if user already exists
    cur.execute("SELECT id FROM users WHERE email=%s", (email,))
    if cur.fetchone():
        return jsonify({"message": "Email already registered"}), 409

    otp = str(random.randint(100000, 999999))
    otp_expiry = datetime.utcnow() + timedelta(minutes=10)


    # Store OTP TEMPORARILY (NOT USER)
    cur.execute("""
        INSERT INTO pending_users (name, email, phone, password, otp, otp_expiry)
        VALUES (%s,%s,%s,%s,%s,%s)
        ON CONFLICT (email) DO UPDATE
        SET otp=%s, otp_expiry=%s
    """, (name, email, phone, password, otp, otp_expiry, otp, otp_expiry))

    conn.commit()
    cur.close()
    conn.close()

    send_otp_email(email, otp)

    return jsonify({"message": "OTP sent"}), 200



# ================= VERIFY OTP & CREATE USER =================
@app.route("/api/signup-verify", methods=["POST"])
def signup_verify():
    data = request.json
    email = data["email"]
    otp = data["otp"]

    conn = get_db_connection()
    if not conn:
        return jsonify({"message": "Database connection failed"}), 500
    cur = conn.cursor()

    cur.execute("""
        SELECT name, phone, password, otp, otp_expiry
        FROM pending_users WHERE email=%s
    """, (email,))
    row = cur.fetchone()

    if not row:
        return jsonify({"message": "No signup request found"}), 400

    name, phone, password, db_otp, otp_expiry = row

    if otp != db_otp:
        return jsonify({"message": "Invalid OTP"}), 401

    if datetime.utcnow() > otp_expiry:
        return jsonify({"message": "OTP expired"}), 401

    password_hash = generate_password_hash(password)

    cur.execute("""
        INSERT INTO users (name,email,phone,password_hash,is_verified)
        VALUES (%s,%s,%s,%s,true)
    """, (name, email, phone, password_hash))

    cur.execute("DELETE FROM pending_users WHERE email=%s", (email,))
    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"message": "Signup successful"}), 200





@app.route('/api/login', methods=['POST'])
def login_api():
    """User login endpoint"""
    try:
        data = request.get_json()
        
        email = data.get('email', '').lower().strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400
        
        # Get user from database
        conn = get_db_connection()
        if not conn:
            return jsonify({'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT * FROM users WHERE email = %s",
            (email,)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return jsonify({'message': 'Invalid email or password'}), 401
        
        # Verify password
        if not check_password_hash(user["password_hash"], password):
            return jsonify({"message": "Invalid email or password"}), 401

        
        if not user["is_verified"]:
            return jsonify({"message": "Please verify your email first"}), 403

        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'email': user['email'],
            'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'is_verified': user['is_verified']
            }
        }), 200
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'message': 'An error occurred'}), 500


@app.route('/api/forgot-password', methods=['POST'])
def forgot_password_api():
    """Forgot password endpoint"""
    try:
        data = request.get_json()
        email = data.get('email', '').lower().strip()
        
        if not email:
            return jsonify({'message': 'Email is required'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if user:
            # Generate reset token
            reset_token = secrets.token_urlsafe(32)
            reset_token_expiry = datetime.utcnow() + timedelta(hours=1)
            
            cur.execute(
                "UPDATE users SET reset_token = %s, reset_token_expiry = %s WHERE id = %s",
                (reset_token, reset_token_expiry, user['id'])
            )
            conn.commit()
            
            # Send password reset email
            send_password_reset_email(email, reset_token)
        
        cur.close()
        conn.close()
        
        # Always return success (don't reveal if email exists)
        return jsonify({'message': 'If the email exists, a reset link has been sent'}), 200
        
    except Exception as e:
        print(f"Forgot password error: {e}")
        return jsonify({'message': 'An error occurred'}), 500


@app.route('/api/reset-password', methods=['POST'])
def reset_password_api():
    """Reset password with token"""
    try:
        data = request.get_json()
        token = data.get('token', '')
        password = data.get('password', '')
        
        if not token or not password:
            return jsonify({'message': 'Token and password are required'}), 400
        
        if len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Find user with valid reset token
        cur.execute(
            "SELECT * FROM users WHERE reset_token = %s AND reset_token_expiry > NOW()",
            (token,)
        )
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return jsonify({'message': 'Invalid or expired reset token'}), 400
        
        # Update password and clear reset token
        password_hash = generate_password_hash(password)
        cur.execute(
            "UPDATE users SET password_hash = %s, reset_token = NULL, reset_token_expiry = NULL WHERE id = %s",
            (password_hash, user['id'])
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({'message': 'Password reset successful'}), 200
        
    except Exception as e:
        print(f"Reset password error: {e}")
        return jsonify({'message': 'An error occurred'}), 500

@app.route('/api/verify-token', methods=['POST'])
@token_required
def verify_token(current_user_id):
    """Verify JWT token"""
    return jsonify({'message': 'Token is valid', 'user_id': current_user_id}), 200

@app.route('/api/user/profile', methods=['GET'])
@token_required
def get_profile(current_user_id):
    """Get user profile"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'message': 'Database connection failed'}), 500
        
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute(
            "SELECT id, name, email, phone, is_verified, created_at FROM users WHERE id = %s",
            (current_user_id,)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({'user': dict(user)}), 200
        
    except Exception as e:
        print(f"Get profile error: {e}")
        return jsonify({'message': 'An error occurred'}), 500
    
@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    data = request.get_json()
    email = data.get("email")
    otp = data.get("otp")

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    cur.execute("""
        SELECT * FROM users
        WHERE email=%s AND otp=%s AND otp_expiry > NOW()
    """, (email, otp))

    user = cur.fetchone()

    if not user:
        return jsonify({"message": "Invalid or expired OTP"}), 400

    cur.execute("""
        UPDATE users
        SET is_verified=TRUE, otp=NULL, otp_expiry=NULL
        WHERE email=%s
    """, (email,))
    conn.commit()

    cur.close()
    conn.close()

    return jsonify({"message": "Email verified successfully"}), 200


@app.route("/ai/upload-csv", methods=["POST"])
def upload_csv():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    return jsonify({
        "status": "success",
        "filename": file.filename
    })


# ============================================================
# AI ANALYSIS MODULE - DUAL MODE (PREDICTIVE + HISTORICAL)
# ============================================================
# This module supports TWO AI modes based on CSV type:
# 1. Products CSV → Predictive Location Suggestions
# 2. Orders CSV → Historical Sales Analysis
# ============================================================


@app.route("/api/chat", methods=["POST"])
def marketing_chat():
    # Parse request data first (outside try block so it's available in except)
    data = request.json or {}
    user_message = data.get("message", "")
    context = data.get("context", {})
    
    print(f"🤖 AI Chat Request - Message: {user_message[:50]}...")
    
    try:
        # Check if API key is configured
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("❌ GEMINI_API_KEY is not set!")
            raise Exception("GEMINI_API_KEY not configured")
        
        # Re-configure Gemini with current API key (in case startup config failed)
        genai.configure(api_key=api_key)
        ai_model = genai.GenerativeModel("gemini-2.0-flash")
        
        prompt = f"""
You are MyBotify AI Marketing Strategist.

Store Analysis Context:
Mode: {context.get("mode")}
Top States: {context.get("topStates")}
Sales Data: {context.get("salesData")}
AI Suggestions: {context.get("aiSuggestions")}
Summary: {context.get("summary")}

User Question:
{user_message}

Give marketing advice in clear business language.
Be concise but useful. Keep response under 100 words.
"""

        print("🔄 Calling Gemini API...")
        response = ai_model.generate_content(prompt)
        print("✅ Gemini API response received")

        return jsonify({
            "reply": response.text
        })
    except Exception as e:
        print(f"❌ Gemini AI Error: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback to rule-based responses
        message = user_message.lower() if user_message else ""
        top_states = context.get("topStates", [])
        
        if "where" in message:
            if top_states:
                reply = f"Based on your data, prioritize campaigns in {', '.join(top_states[:3])}."
            else:
                reply = "Upload your store data first so I can analyze target regions."
        elif "budget" in message:
            if top_states:
                reply = f"Allocate most budget to {top_states[0]} and test smaller campaigns in other states."
            else:
                reply = "Upload data first to calculate budget strategy."
        elif "why" in message:
            reply = "These states were recommended based on product-market fit and sales trends."
        elif "product" in message:
            reply = "Focus on promoting your dominant product category in high-performing states."
        else:
            reply = "I can help with campaign targeting, budget planning, and product promotion. Try asking about these topics!"
        
        return jsonify({"reply": reply})



def detect_csv_type(columns):
    """
    Detect whether the uploaded CSV is a Products export or Orders export.
    Returns: "products" or "orders"
    
    Products CSV indicators: Title, Handle, Vendor, Product Category, Tags
    Orders CSV indicators: Billing Country, Billing Province, Total, Subtotal
    """
    columns_lower = [col.lower() for col in columns]
    
    # Orders CSV indicators (these columns are specific to order exports)
    order_indicators = ['billing country', 'billing province', 'shipping country', 
                        'subtotal', 'total', 'order id', 'order name']
    order_score = sum(1 for ind in order_indicators if any(ind in col for col in columns_lower))
    
    # Products CSV indicators
    product_indicators = ['handle', 'vendor', 'product category', 'tags', 
                          'variant price', 'variant sku', 'body (html)']
    product_score = sum(1 for ind in product_indicators if any(ind in col for col in columns_lower))
    
    print(f"📊 CSV Detection - Orders score: {order_score}, Products score: {product_score}")
    
    # If has order-specific columns, it's an orders CSV
    if order_score >= 2:
        return "orders"
    # Otherwise treat as products CSV
    return "products"


def get_price_tier(price):
    """Classify product into price tier for targeting."""
    if price >= 200:
        return "luxury"
    elif price >= 50:
        return "premium"
    elif price >= 20:
        return "mid-range"
    else:
        return "budget"


def predict_states_for_category(category, price_tier, keywords):
    """
    Rule-based prediction of high-potential US states based on product attributes.
    This uses market research heuristics (simplified for MVP).
    
    Returns: dict with state -> score
    """
    # Base state potential scores (population + purchasing power)
    state_base_scores = {
        "California": 95, "Texas": 90, "New York": 88, "Florida": 85,
        "Illinois": 75, "Pennsylvania": 72, "Ohio": 70, "Georgia": 68,
        "North Carolina": 65, "Michigan": 62, "New Jersey": 78,
        "Virginia": 70, "Washington": 75, "Arizona": 65, "Massachusetts": 80,
        "Tennessee": 60, "Indiana": 55, "Missouri": 55, "Maryland": 72,
        "Wisconsin": 55, "Colorado": 70, "Minnesota": 65, "South Carolina": 58,
        "Alabama": 50, "Louisiana": 52, "Kentucky": 50, "Oregon": 65,
        "Oklahoma": 48, "Connecticut": 75, "Utah": 60, "Iowa": 48,
        "Nevada": 62, "Arkansas": 45, "Mississippi": 42, "Kansas": 48,
        "New Mexico": 50, "Nebraska": 48, "Idaho": 52, "West Virginia": 42,
        "Hawaii": 65, "New Hampshire": 68, "Maine": 55, "Montana": 48,
        "Rhode Island": 65, "Delaware": 68, "South Dakota": 45,
        "North Dakota": 48, "Alaska": 55, "Vermont": 58, "Wyoming": 45
    }
    
    scores = state_base_scores.copy()
    category_lower = category.lower() if category else ""
    keywords_lower = [k.lower() for k in keywords] if keywords else []
    all_text = category_lower + " " + " ".join(keywords_lower)
    
    # ========================================
    # CATEGORY-BASED ADJUSTMENTS
    # ========================================
    
    # Tech/Electronics → High in tech hubs
    if any(term in all_text for term in ['tech', 'electronic', 'gadget', 'computer', 'phone']):
        for state in ['California', 'Washington', 'Texas', 'Massachusetts', 'New York']:
            scores[state] = scores.get(state, 50) + 15
    
    # Fashion/Luxury → High in wealthy urban areas
    if any(term in all_text for term in ['fashion', 'luxury', 'designer', 'premium', 'jewelry']):
        for state in ['New York', 'California', 'Florida', 'New Jersey', 'Connecticut']:
            scores[state] = scores.get(state, 50) + 15
    
    # Outdoor/Sports → High in outdoor-friendly states
    if any(term in all_text for term in ['outdoor', 'camping', 'hiking', 'sport', 'fitness']):
        for state in ['Colorado', 'Oregon', 'Washington', 'Utah', 'Montana', 'California']:
            scores[state] = scores.get(state, 50) + 15
    
    # Home & Garden → Suburban areas
    if any(term in all_text for term in ['home', 'garden', 'furniture', 'decor', 'kitchen']):
        for state in ['Texas', 'Florida', 'Arizona', 'Georgia', 'North Carolina']:
            scores[state] = scores.get(state, 50) + 12
    
    # Baby/Kids products → Family-friendly states
    if any(term in all_text for term in ['baby', 'kid', 'child', 'toy', 'infant', 'toddler']):
        for state in ['Texas', 'Utah', 'Arizona', 'Georgia', 'Florida', 'North Carolina']:
            scores[state] = scores.get(state, 50) + 15
    
    # Winter/Cold weather → Northern states
    if any(term in all_text for term in ['winter', 'cold', 'snow', 'fleece', 'warm']):
        for state in ['Minnesota', 'Wisconsin', 'Michigan', 'New York', 'Massachusetts', 'Colorado']:
            scores[state] = scores.get(state, 50) + 12
    
    # Beach/Summer → Coastal/warm states
    if any(term in all_text for term in ['beach', 'summer', 'swim', 'sun', 'tropical']):
        for state in ['Florida', 'California', 'Hawaii', 'Texas', 'South Carolina']:
            scores[state] = scores.get(state, 50) + 15
    
    # ========================================
    # PRICE TIER ADJUSTMENTS
    # ========================================
    
    if price_tier == "luxury":
        # Boost high-income states for luxury products
        for state in ['New York', 'California', 'Connecticut', 'Massachusetts', 'New Jersey']:
            scores[state] = scores.get(state, 50) + 10
    elif price_tier == "budget":
        # Boost value-conscious states
        for state in ['Texas', 'Ohio', 'Michigan', 'Pennsylvania', 'Georgia']:
            scores[state] = scores.get(state, 50) + 8
    
    return scores


def analyze_products_predictive(df, columns):
    """
    Analyze Products CSV and predict high-potential US states.
    Uses product attributes to make market predictions.
    """
    # Find relevant columns
    title_col = next((c for c in columns if c.lower() in ['title', 'product title', 'name']), None)
    price_col = next((c for c in columns if 'price' in c.lower()), None)
    category_col = next((c for c in columns if 'category' in c.lower() or 'type' in c.lower()), None)
    vendor_col = next((c for c in columns if c.lower() == 'vendor'), None)
    tags_col = next((c for c in columns if c.lower() == 'tags'), None)
    
    print(f"📦 Product columns: title={title_col}, price={price_col}, category={category_col}")
    
    # Extract product data
    products_analyzed = len(df)
    
    # Get price statistics
    avg_price = 0
    price_tier = "mid-range"
    if price_col:
        df[price_col] = pd.to_numeric(
            df[price_col].astype(str).str.replace(r'[$,]', '', regex=True),
            errors='coerce'
        ).fillna(0)
        avg_price = df[price_col].mean()
        price_tier = get_price_tier(avg_price)
    
    # Get dominant category
    dominant_category = "General"
    if category_col:
        category_counts = df[category_col].value_counts()
        if len(category_counts) > 0:
            dominant_category = str(category_counts.index[0])
    
    # Collect keywords from titles and tags
    keywords = []
    if title_col:
        keywords.extend(df[title_col].dropna().astype(str).str.lower().tolist())
    if tags_col:
        tags_text = df[tags_col].dropna().astype(str).str.lower().str.cat(sep=' ')
        keywords.extend(tags_text.split(','))
    
    # Get state predictions
    state_scores = predict_states_for_category(dominant_category, price_tier, keywords)
    
    # Sort and get top states
    sorted_states = sorted(state_scores.items(), key=lambda x: x[1], reverse=True)
    top_states = [state for state, score in sorted_states[:5]]
    
    # ========================================
    # Generate AI Suggestions (Predictive)
    # ========================================
    suggestions = []
    
    # Main prediction insight
    suggestions.append(
        f"🎯 Based on your {products_analyzed} products (avg ${avg_price:.2f}, {price_tier} tier), "
        f"we predict strong market potential in: {', '.join(top_states[:3])}."
    )
    
    # Category-based insight
    if dominant_category != "General":
        suggestions.append(
            f"📦 Your dominant category '{dominant_category}' performs well in {top_states[0]} and {top_states[1]}. "
            f"Consider geo-targeted ads for these regions."
        )
    
    # Price-tier insight
    if price_tier == "luxury":
        suggestions.append(
            "💎 Your luxury price point ($200+) suggests targeting high-income areas: "
            "NYC metro, San Francisco Bay Area, and South Florida."
        )
    elif price_tier == "premium":
        suggestions.append(
            "⭐ Your premium pricing ($50-200) appeals to suburban professionals. "
            "Focus on states with strong middle-class markets."
        )
    elif price_tier == "budget":
        suggestions.append(
            "💰 Your value-oriented pricing (<$20) works well for volume-based campaigns. "
            "Consider broad targeting in high-population states."
        )
    
    # Actionable campaign suggestion
    suggestions.append(
        f"🚀 Recommended action: Launch test campaigns in {top_states[0]} first, "
        f"then expand to {top_states[1]} and {top_states[2]} based on performance."
    )
    
    return {
        "mode": "predictive",
        "predicted_states": top_states,
        "state_scores": {state: score for state, score in sorted_states[:10]},
        "ai_suggestions": suggestions,
        "analysis_summary": {
            "products_analyzed": products_analyzed,
            "avg_price": round(avg_price, 2),
            "price_tier": price_tier,
            "dominant_category": dominant_category
        }
    }


def analyze_orders_historical(df, columns):
    """
    Analyze Orders CSV with historical sales data.
    This is the existing functionality, now properly encapsulated.
    """
    # Find required columns
    country_col = next((c for c in columns if c.lower() in 
                        ['country', 'billing country', 'shipping country']), None)
    state_col = next((c for c in columns if c.lower() in 
                      ['state', 'billing province', 'shipping province', 'province', 'region']), None)
    sales_col = next((c for c in columns if c.lower() in 
                      ['total', 'subtotal', 'revenue', 'amount', 'order total']), None)
    product_col = next((c for c in columns if c.lower() in 
                        ['product', 'title', 'lineitem name', 'item']), None)
    
    # Validate required columns
    missing = []
    if not country_col:
        missing.append("Country (e.g., 'Billing Country')")
    if not state_col:
        missing.append("State (e.g., 'Billing Province')")
    if not sales_col:
        missing.append("Sales (e.g., 'Total', 'Subtotal')")
    
    if missing:
        return {
            "error": f"Missing required columns: {', '.join(missing)}",
            "found_columns": columns,
            "tip": "Please ensure your Orders CSV has Country, State, and Total/Subtotal columns."
        }
    
    print(f"📊 Orders columns: country={country_col}, state={state_col}, sales={sales_col}")
    
    # Clean sales data
    df[sales_col] = pd.to_numeric(
        df[sales_col].astype(str).str.replace(r'[$,]', '', regex=True),
        errors='coerce'
    ).fillna(0)
    
    # Filter USA only
    usa_variations = ['United States', 'US', 'USA', 'united states']
    usa_df = df[df[country_col].astype(str).str.strip().isin(usa_variations)]
    
    if len(usa_df) == 0:
        return {
            "error": "No US data found in the CSV",
            "tip": "Make sure your CSV contains orders from the United States."
        }
    
    # Aggregate by state
    state_sales = (
        usa_df.groupby(state_col)[sales_col]
        .sum()
        .sort_values(ascending=False)
    )
    state_sales = state_sales[state_sales.index.astype(str).str.strip() != '']
    
    # Get top products per state
    top_products = {}
    if product_col:
        for state in state_sales.head(5).index:
            state_data = usa_df[usa_df[state_col] == state]
            if len(state_data) > 0:
                top_product = state_data.groupby(product_col)[sales_col].sum().idxmax()
                top_products[state] = top_product
    
    # ========================================
    # Generate AI Suggestions (Historical)
    # ========================================
    suggestions = []
    total_revenue = float(state_sales.sum())
    
    for state, revenue in state_sales.head(5).items():
        pct = (revenue / total_revenue * 100) if total_revenue > 0 else 0
        
        if revenue > 5000:
            suggestions.append(
                f"🔥 {state} is a top performer (${revenue:,.0f}, {pct:.1f}% of sales). "
                f"Scale your ad campaigns here!"
            )
        elif revenue > 2000:
            suggestions.append(
                f"📈 {state} shows strong potential (${revenue:,.0f}). "
                f"Consider increasing ad spend to boost growth."
            )
        else:
            suggestions.append(
                f"🧪 {state} has room to grow (${revenue:,.0f}). "
                f"Test targeted campaigns to expand this market."
            )
    
    # Add product-specific suggestions
    if top_products:
        for state, product in list(top_products.items())[:2]:
            suggestions.append(
                f"🎯 '{product}' is your best seller in {state}. Feature it in regional ads!"
            )
    
    return {
        "mode": "historical",
        "top_states": list(state_sales.head(5).index),
        "low_states": list(state_sales.tail(3).index),
        "sales_by_state": state_sales.to_dict(),
        "top_products_per_state": top_products,
        "ai_suggestions": suggestions,
        "total_us_revenue": total_revenue,
        "states_analyzed": len(state_sales),
        "orders_analyzed": len(usa_df)
    }


@app.route("/ai/analyze", methods=["POST"])
def analyze_csv():
    """
    Unified AI Analysis Endpoint
    
    Automatically detects CSV type and routes to appropriate analysis:
    - Products CSV → Predictive mode (suggests high-potential states)
    - Orders CSV → Historical mode (analyzes actual sales data)
    """
    data = request.json
    filename = data.get("filename")

    if not filename:
        return jsonify({"error": "Filename is required"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, filename)

    if not os.path.exists(file_path):
        return jsonify({"error": "File not found"}), 404

    try:
        df = pd.read_csv(file_path)
        columns = df.columns.tolist()
        print(f"📊 CSV Columns: {columns}")
        
        # ========================================
        # AUTO-DETECT CSV TYPE
        # ========================================
        csv_type = detect_csv_type(columns)
        print(f"🔍 Detected CSV type: {csv_type.upper()}")
        
        # ========================================
        # ROUTE TO APPROPRIATE ANALYSIS
        # ========================================
        if csv_type == "products":
            result = analyze_products_predictive(df, columns)
        else:
            result = analyze_orders_historical(df, columns)
        
        # Check for errors from analysis functions
        if "error" in result:
            return jsonify(result), 400
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Analysis error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500






UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)




# Email functions

def send_verification_email(email, token):
    """Send email verification link using Brevo API"""
    try:
        base_url = os.environ.get('BASE_URL', 'https://mybotify-login.onrender.com')
        verification_link = f"{base_url}/verify-email?token={token}"
        
        if not BREVO_API_KEY:
            print(f"⚠️ BREVO_API_KEY not set. Verification link for {email}: {verification_link}")
            return True
        
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": email}],
            sender={"name": EMAIL_FROM_NAME, "email": EMAIL_FROM},
            subject="Verify Your MyBotify Account",
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #667eea;">Welcome to MyBotify!</h2>
                <p>Please click the button below to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Verify Email</a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
                <p style="color: #666; font-size: 14px;">If you didn't create an account, please ignore this email.</p>
                <br>
                <p>Best regards,<br>MyBotify Team</p>
            </div>
            """
        )
        
        response = api_instance.send_transac_email(send_smtp_email)
        print(f"✅ Verification email sent to {email}: {response}")
        return True
    except ApiException as e:
        print(f"❌ Verification email error: {e}")
        return False
    except Exception as e:
        print(f"❌ Verification email error: {e}")
        return False

def send_password_reset_email(email, token):
    """Send password reset link using Brevo API"""
    try:
        base_url = os.environ.get('BASE_URL', 'https://mybotify-login.onrender.com')
        reset_link = f"{base_url}/reset-password?token={token}"
        
        if not BREVO_API_KEY:
            print(f"⚠️ BREVO_API_KEY not set. Reset link for {email}: {reset_link}")
            return True
        
        api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
        
        send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(
            to=[{"email": email}],
            sender={"name": EMAIL_FROM_NAME, "email": EMAIL_FROM},
            subject="Reset Your MyBotify Password",
            html_content=f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #667eea;">Reset Your Password</h2>
                <p>You requested to reset your MyBotify password.</p>
                <p>Click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                <p style="color: #666; font-size: 14px;">If you didn't request a password reset, please ignore this email.</p>
                <br>
                <p>Best regards,<br>MyBotify Team</p>
            </div>
            """
        )
        
        response = api_instance.send_transac_email(send_smtp_email)
        print(f"✅ Password reset email sent to {email}: {response}")
        return True
    except ApiException as e:
        print(f"❌ Password reset email error: {e}")
        return False
    except Exception as e:
        print(f"❌ Password reset email error: {e}")
        return False

# Duplicate route removed - using api_health() above

if __name__ == '__main__':
    # Initialize database on startup
    init_database()
    
    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)

