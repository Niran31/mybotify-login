# MyBotify - Quick Start Guide

## ⚡ Fast Setup (5 minutes)

### 1. Install PostgreSQL
```bash
sudo apt update && sudo apt install postgresql postgresql-contrib -y
sudo service postgresql start
```

### 2. Create Database
```bash
sudo -u postgres psql -c "CREATE DATABASE mybotify_db;"
sudo -u postgres psql -c "CREATE USER mybotify_user WITH PASSWORD 'mybotify123';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mybotify_db TO mybotify_user;"
```

### 3. Setup Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. Configure Environment
```bash
# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_NAME=mybotify_db
DB_USER=mybotify_user
DB_PASSWORD=mybotify123
DB_PORT=5432
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
EOF
```

### 5. Run Application
```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python app.py

# Terminal 2 - Frontend (new terminal)
cd frontend
python3 -m http.server 8000
```

### 6. Access Application
- Frontend: http://localhost:8000
- Backend API: http://localhost:5000

## 📧 Gmail Setup (Required for Email Verification)

1. Go to: https://myaccount.google.com/apppasswords
2. Create app password for "Mail"
3. Copy the 16-character password
4. Update `.env` file with:
   - `MAIL_USERNAME`: your Gmail address
   - `MAIL_PASSWORD`: the app password (no spaces)

## ✅ Test the Application

1. Go to http://localhost:8000/signup.html
2. Register with your email
3. Check email for verification link
4. Click verification link
5. Login at http://localhost:8000/login.html
6. Access dashboard

## 🐛 Common Issues

### Database Connection Error
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Restart if needed
sudo service postgresql restart
```

### Email Not Working
- Enable 2FA on Google account
- Use App Password, not regular password
- Check spam folder for emails

### Port Already in Use
```bash
# Backend (port 5000)
lsof -ti:5000 | xargs kill -9

# Frontend (port 8000)
lsof -ti:8000 | xargs kill -9
```

## 📚 Next Steps

- Read full README.md for detailed documentation
- Explore API endpoints in backend/app.py
- Customize design in frontend/css/style.css
- Add new features as needed

---

**Need help? Check the README.md or review the code comments!**
