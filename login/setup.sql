-- MyBotify Database Setup
-- Run this to create the database and tables

-- Create database (run this first as superuser)
CREATE DATABASE mybotify_db;

-- Connect to the database
\c mybotify_db;

-- Create users table
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
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON users(email);

-- Create index on verification token
CREATE INDEX idx_users_verification_token ON users(verification_token);

-- Create index on reset token
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- Sample data (optional - for testing)
-- INSERT INTO users (name, email, phone, password_hash, is_verified) 
-- VALUES ('Test User', 'test@example.com', '1234567890', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWN3F.iYaSu', true);
-- Password for above user is: password123

-- Display tables
\dt

-- Display table structure
\d users;
