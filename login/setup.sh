#!/bin/bash

# MyBotify Setup Script
# This script automates the setup process

echo "================================"
echo "MyBotify Authentication System"
echo "Automated Setup Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Ubuntu/Debian
if ! command -v apt &> /dev/null; then
    echo -e "${RED}This script is designed for Ubuntu/Debian systems${NC}"
    exit 1
fi

# Step 1: Install PostgreSQL
echo -e "${YELLOW}Step 1: Installing PostgreSQL...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}PostgreSQL already installed${NC}"
else
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
    echo -e "${GREEN}PostgreSQL installed${NC}"
fi

# Step 2: Start PostgreSQL
echo -e "${YELLOW}Step 2: Starting PostgreSQL...${NC}"
sudo service postgresql start
echo -e "${GREEN}PostgreSQL started${NC}"

# Step 3: Create Database
echo -e "${YELLOW}Step 3: Creating database...${NC}"
sudo -u postgres psql -c "CREATE DATABASE mybotify_db;" 2>/dev/null || echo "Database may already exist"
sudo -u postgres psql -c "CREATE USER mybotify_user WITH PASSWORD 'mybotify123';" 2>/dev/null || echo "User may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE mybotify_db TO mybotify_user;" 2>/dev/null
echo -e "${GREEN}Database created${NC}"

# Step 4: Initialize tables
echo -e "${YELLOW}Step 4: Initializing database tables...${NC}"
cd "$(dirname "$0")"
if [ -f "database/setup.sql" ]; then
    sudo -u postgres psql mybotify_db < database/setup.sql
    echo -e "${GREEN}Tables created${NC}"
else
    echo -e "${YELLOW}setup.sql not found, tables will be created by Flask on first run${NC}"
fi

# Step 5: Install Python dependencies
echo -e "${YELLOW}Step 5: Installing Python dependencies...${NC}"
cd backend

# Check if venv exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo -e "${GREEN}Virtual environment created${NC}"
fi

source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo -e "${GREEN}Python dependencies installed${NC}"

# Step 6: Create .env file
echo -e "${YELLOW}Step 6: Creating environment configuration...${NC}"
if [ ! -f ".env" ]; then
    SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(32))')
    
    cat > .env << EOF
# Database Configuration
DB_HOST=localhost
DB_NAME=mybotify_db
DB_USER=mybotify_user
DB_PASSWORD=mybotify123
DB_PORT=5432

# Flask Configuration
SECRET_KEY=$SECRET_KEY
FLASK_ENV=development

# Email Configuration (UPDATE THESE!)
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-gmail-app-password
EOF
    
    echo -e "${GREEN}.env file created${NC}"
    echo -e "${YELLOW}⚠️  IMPORTANT: Update .env file with your Gmail credentials!${NC}"
else
    echo -e "${GREEN}.env file already exists${NC}"
fi

cd ..

# Summary
echo ""
echo "================================"
echo -e "${GREEN}Setup Complete!${NC}"
echo "================================"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Update backend/.env with your Gmail credentials:"
echo "   - MAIL_USERNAME: your Gmail address"
echo "   - MAIL_PASSWORD: your Gmail app password"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   python3 -m http.server 8000"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost:8000"
echo "   Backend:  http://localhost:5000"
echo ""
echo "📧 Gmail App Password Setup:"
echo "   1. Enable 2FA on your Google account"
echo "   2. Visit: https://myaccount.google.com/apppasswords"
echo "   3. Create app password for 'Mail'"
echo "   4. Update MAIL_PASSWORD in backend/.env"
echo ""
echo "📚 For more details, see README.md"
echo ""
