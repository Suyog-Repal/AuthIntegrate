-- 🔧 Local MySQL Database Setup for AuthIntegrate
-- Run this script with: mysql -u root -p < setup-local-db.sql

-- Create database
CREATE DATABASE IF NOT EXISTS authintegrate;
USE authintegrate;

-- Create admin user (if not exists)
-- First, check and create user
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'authintegrate123';
GRANT ALL PRIVILEGES ON authintegrate.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY,
  finger_id INT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_finger_id (finger_id)
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mobile VARCHAR(20),
  password_hash TEXT NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_email (email)
);

-- Create access_logs table
CREATE TABLE IF NOT EXISTS access_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  result ENUM('GRANTED', 'DENIED', 'REGISTERED') NOT NULL,
  note VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Set timezone for session
SET time_zone = '+05:30';

-- Verify tables
SELECT 'Tables created successfully!' as status;
SHOW TABLES;

-- Show user privileges
SELECT user, host FROM mysql.user WHERE user='admin';
