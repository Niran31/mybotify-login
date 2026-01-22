"""
MyBotify Authentication Backend
Flask application with PostgreSQL database, JWT auth, and email verification
"""
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
import psycopg2
from psycopg2.extras import RealDictCursor
import jwt
import os

# Get DATABASE_URL from environment variable (Render sets this automatically)
DATABASE_URL = os.environ.get("DATABASE_URL")

# Fallback for local development if needed
if not DATABASE_URL:
    DATABASE_URL = "postgresql://mybotify_db_user:HYCww4RmBdps1sI7k4ZkqXRwcD6Fc6wN@dpg-d5nl6m1r0fns73fl2vr0-a.oregon-postgres.render.com/mybotify_db"

import secrets
from functools import wraps
from flask import Flask, render_template
import random
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash




app = Flask(__name__)
CORS(app)

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_EXPIRATION_HOURS'] = 24

# Email configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True

app.config['MAIL_USERNAME'] = 'niranjannivash0@gmail.com'   # 🔴 YOUR REAL GMAIL
app.config['MAIL_PASSWORD'] = 'ihbo gulv lxpj hmdq'       # 🔴 16-digit APP PASSWORD
app.config['MAIL_DEFAULT_SENDER'] = 'niranjannivash0@gmail.com'


mail = Mail(app)


def send_otp_email(email, otp):
    try:
        # Check if we should skip email (Render blocks SMTP on free tier)
        if os.environ.get('SKIP_EMAIL', 'false').lower() == 'true':
            print(f"📧 Email skipped (SKIP_EMAIL=true). OTP for {email}: {otp}")
            return True
        
        msg = Message(
            subject="MyBotify Email Verification",
            recipients=[email],
            body=f"""
Hello,

Your MyBotify verification OTP is: {otp}

This OTP is valid for 10 minutes.

If you did not sign up, please ignore this email.

Thanks,
MyBotify Team
"""
        )
        mail.send(msg)
        print("✅ OTP email sent to:", email)
        return True
    except Exception as e:
        print("❌ OTP email failed:", e)
        return False



@app.route("/")
def home_page():
    return render_template("index.html")


@app.route("/login")
def login_page():
    return render_template("login.html")


@app.route("/signup")
def signup_page():
    return render_template("signup.html")



@app.route("/forgot-password")
def forgot_password_page():
    return render_template("forgot-password.html")


@app.route("/dashboard")
def dashboard_page():
    return render_template("dashboard.html")

@app.route("/profile")
def profile_page():
    return render_template("profile.html")


@app.route("/logout")
def logout():
    """Logout user and redirect to home page"""
    # Clear any session data if you're using sessions
    # For now, just redirect to home page
    # The frontend should also clear the JWT token from localStorage
    return render_template("index.html")


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


# Email functions

def send_verification_email(email, token):
    """Send email verification link"""
    try:
        verification_link = f"http://localhost:5000/verify-email?token={token}"
        
        msg = Message(
            'Verify Your MyBotify Account',
            recipients=[email]
        )
        msg.body = f"""
        Welcome to MyBotify!
        
        Please click the link below to verify your email address:
        {verification_link}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
        
        Best regards,
        MyBotify Team
        """
        
        mail.send(msg)
        print(f"Verification email sent to {email}")
    except Exception as e:
        print(f"Email sending error: {e}")

def send_password_reset_email(email, token):
    """Send password reset link"""
    try:
        # Use environment variable for base URL, fallback to Render URL
        base_url = os.environ.get('BASE_URL', 'https://mybotify-login.onrender.com')
        reset_link = f"{base_url}/reset-password?token={token}"
        
        # Check if we should skip email (Render blocks SMTP on free tier)
        if os.environ.get('SKIP_EMAIL', 'false').lower() == 'true':
            print(f"📧 Email skipped (SKIP_EMAIL=true). Reset link for {email}: {reset_link}")
            return True
        
        msg = Message(
            'Reset Your MyBotify Password',
            recipients=[email]
        )
        msg.body = f"""
        You requested to reset your MyBotify password.
        
        Please click the link below to reset your password:
        {reset_link}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
        
        Best regards,
        MyBotify Team
        """
        
        mail.send(msg)
        print(f"✅ Password reset email sent to {email}")
        return True
    except Exception as e:
        print(f"❌ Email sending error: {e}")
        return False

@app.route('/')
def home():
    """Health check endpoint"""
    return jsonify({'message': 'MyBotify API is running', 'version': '1.0'}), 200

if __name__ == '__main__':
    # Initialize database on startup
    init_database()
    
    # Run Flask app
    app.run(debug=True, host='0.0.0.0', port=5000)

