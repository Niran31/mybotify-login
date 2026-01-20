# MyBotify Authentication System

A complete full-stack authentication system built with Flask (Python), PostgreSQL, and vanilla JavaScript. This project includes user registration, login, email verification, password reset, and a user dashboard.

## 🎯 Features

- ✅ User Registration with validation
- ✅ Email Verification
- ✅ Login/Logout with JWT tokens
- ✅ Password Reset functionality
- ✅ Protected Dashboard
- ✅ Responsive Design
- ✅ PostgreSQL Database
- ✅ Secure password hashing with bcrypt
- ✅ Email notifications
- ✅ Modern UI/UX

## 📁 Project Structure

```
mybotify-auth/
├── frontend/
│   ├── css/
│   │   └── style.css          # All styles
│   ├── js/
│   │   ├── main.js            # Homepage JS
│   │   ├── auth.js            # Authentication JS
│   │   └── dashboard.js       # Dashboard JS
│   ├── index.html             # Landing page
│   ├── login.html             # Login page
│   ├── signup.html            # Signup page
│   ├── forgot-password.html   # Password reset
│   ├── verify-email.html      # Email verification
│   └── dashboard.html         # User dashboard
├── backend/
│   ├── app.py                 # Flask application
│   ├── requirements.txt       # Python dependencies
│   └── .env.example           # Environment variables template
└── database/
    └── setup.sql              # Database schema
```

## 🚀 Setup Instructions

### Prerequisites

- Python 3.8 or higher
- PostgreSQL 12 or higher
- Git
- Gmail account (for email functionality)

### Step 1: Clone or Setup Project

```bash
# The project files are already created in /home/claude/mybotify-auth
cd /home/claude/mybotify-auth
```

### Step 2: Database Setup

1. Install PostgreSQL (if not installed):
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start
```

2. Create database and user:
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE mybotify_db;
CREATE USER mybotify_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mybotify_db TO mybotify_user;
\q
```

3. Initialize database tables:
```bash
psql -U mybotify_user -d mybotify_db -f database/setup.sql
```

### Step 3: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Configure environment variables:
```bash
cp .env.example .env
nano .env  # Edit with your actual values
```

Required environment variables:
```env
DB_HOST=localhost
DB_NAME=mybotify_db
DB_USER=mybotify_user
DB_PASSWORD=your_password
DB_PORT=5432

SECRET_KEY=your-secret-key-here

MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
```

### Step 4: Gmail App Password Setup

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to App Passwords: https://myaccount.google.com/apppasswords
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Use this password in your `.env` file as `MAIL_PASSWORD`

### Step 5: Run the Application

1. Start the Flask backend:
```bash
cd backend
source venv/bin/activate  # Activate virtual environment
python app.py
```

The backend will run on `http://localhost:5000`

2. Serve the frontend (in a new terminal):
```bash
cd frontend

# Option 1: Using Python's built-in server
python3 -m http.server 8000

# Option 2: Using Node.js http-server
npx http-server -p 8000

# Option 3: Using PHP
php -S localhost:8000
```

The frontend will be available at `http://localhost:8000`

## 📖 Usage Guide

### User Registration Flow

1. Go to `http://localhost:8000/signup.html`
2. Fill in your details:
   - Full Name
   - Email
   - Phone Number
   - Password (minimum 6 characters)
3. Accept terms and conditions
4. Click "Sign up"
5. Check your email for verification link
6. Click the verification link in email
7. You'll be redirected to the dashboard

### Login Flow

1. Go to `http://localhost:8000/login.html`
2. Enter your email and password
3. Click "Continue"
4. If email not verified, you'll be redirected to verification page
5. If verified, you'll be redirected to dashboard

### Password Reset Flow

1. On login page, click "Forgot password?"
2. Enter your email address
3. Check your email for reset link
4. Click the reset link
5. Enter new password
6. Login with new password

## 🔧 API Endpoints

### Authentication Endpoints

#### POST `/api/signup`
Register a new user
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "password123"
}
```

#### POST `/api/login`
Login with email and password
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST `/api/verify-email`
Verify email address
```json
{
  "token": "verification_token_here"
}
```

#### POST `/api/resend-verification`
Resend verification email
```json
{
  "email": "john@example.com"
}
```

#### POST `/api/forgot-password`
Request password reset
```json
{
  "email": "john@example.com"
}
```

#### POST `/api/verify-token`
Verify JWT token (requires Authorization header)

#### GET `/api/user/profile`
Get user profile (requires Authorization header)

## 🔐 Security Features

1. **Password Hashing**: Uses bcrypt for secure password storage
2. **JWT Tokens**: Stateless authentication with expiration
3. **Email Verification**: Prevents fake account creation
4. **Password Reset**: Secure token-based password recovery
5. **SQL Injection Protection**: Uses parameterized queries
6. **CORS Protection**: Configured for specific origins
7. **Token Expiration**: JWT tokens expire after 24 hours
8. **Reset Token Expiration**: Reset tokens expire after 1 hour

## 🎨 Design Features

- Clean, modern UI based on your Figma design
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Custom bot character illustration
- Interactive form validation
- Toast notifications for user feedback
- Loading states on buttons

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo service postgresql status

# Restart PostgreSQL
sudo service postgresql restart

# Check database exists
psql -U postgres -l
```

### Email Not Sending
- Verify Gmail app password is correct
- Check if 2FA is enabled on your Google account
- Ensure less secure apps is NOT required (use app password instead)
- Check Flask logs for email errors

### Frontend Not Loading
- Ensure you're using a proper web server (not just opening HTML files)
- Check browser console for errors
- Verify API_BASE_URL in JavaScript files matches your backend URL

### Token Errors
- Clear localStorage in browser
- Check if SECRET_KEY is set in backend
- Verify token hasn't expired

## 📝 Development Notes

### Adding New Features

1. **Backend**: Add routes in `app.py`
2. **Frontend**: Add pages in `frontend/` and link in navigation
3. **Database**: Update schema in `database/setup.sql`
4. **Styles**: Add styles in `css/style.css`

### Testing

Test all flows:
1. Registration → Email Verification → Login → Dashboard
2. Login with unverified email
3. Forgot password flow
4. Token expiration
5. Invalid credentials
6. Duplicate email registration

## 🚀 Deployment

### For Production:

1. **Backend**:
   - Use a production WSGI server (Gunicorn, uWSGI)
   - Set `FLASK_ENV=production`
   - Use strong `SECRET_KEY`
   - Use environment variables for all secrets
   - Enable HTTPS
   - Set up proper CORS origins

2. **Frontend**:
   - Use a CDN or static hosting
   - Update API_BASE_URL to production URL
   - Minify CSS and JS files
   - Optimize images

3. **Database**:
   - Use managed PostgreSQL service
   - Regular backups
   - Enable SSL connections
   - Set up connection pooling

4. **Email**:
   - Consider using SendGrid, Mailgun, or AWS SES
   - Set up SPF and DKIM records

## 📄 License

This project is created for learning purposes.

## 👤 Author

Created by Niranjan

## 🙏 Acknowledgments

- Design inspired by MyBotify website
- Built as a learning project for AI & Full Stack internship

## 📞 Support

If you encounter any issues:
1. Check the troubleshooting section
2. Review the logs in terminal
3. Check browser console for errors
4. Verify all environment variables are set correctly

---

**Happy Coding! 🚀**
