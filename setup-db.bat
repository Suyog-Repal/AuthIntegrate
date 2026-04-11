@echo off
REM 🚀 Quick Setup Script for AuthIntegrate Database
REM Run this as Administrator

echo.
echo ========================================
echo  AuthIntegrate Database Setup (Windows)
echo ========================================
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ ERROR: This script must be run as Administrator!
    echo.
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

echo 1️⃣  Starting MySQL Service...
net start MySQL94 >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MySQL94 service not found, trying MySQL...
    net start MySQL >nul 2>&1
    if errorlevel 1 (
        echo ❌ Could not start MySQL service
        echo Please start it manually:
        echo   Control Panel → Services → MySQL → Right-click → Start
        pause
        exit /b 1
    )
)
echo ✅ MySQL service started!
echo.

REM Wait for MySQL to be ready
echo ⏳ Waiting for MySQL to initialize...
timeout /t 3 /nobreak

echo 2️⃣  Creating database and tables...
REM Try to run setup script
mysql -u root -p < setup-local-db.sql >nul 2>&1
if errorlevel 1 (
    echo.
    echo ⚠️  Could not connect to MySQL as root
    echo.
    echo MANUAL SETUP REQUIRED:
    echo.
    echo 1. Run MySQL Command Line Client as Administrator
    echo 2. Use password if prompted
    echo 3. Paste these commands:
    echo.
    echo CREATE DATABASE IF NOT EXISTS authintegrate;
    echo USE authintegrate;
    echo CREATE USER IF NOT EXISTS 'admin'^@'localhost' IDENTIFIED BY 'authintegrate123';
    echo GRANT ALL PRIVILEGES ON authintegrate.* TO 'admin'^@'localhost';
    echo FLUSH PRIVILEGES;
    echo.
    echo 4. Then run setup-local-db.sql
    echo.
    pause
    exit /b 1
)

echo ✅ Database setup complete!
echo.

echo 3️⃣  Updating .env file...
REM Note: This would require more complex batch scripting, so just inform the user
echo ✅ Next step: Update .env file with local database settings
echo    Open .env and change:
echo    - DB_HOST=localhost
echo    - DB_USER=admin  
echo    - DB_PASS=authintegrate123
echo.

echo ========================================
echo ✅ Setup Complete! 
echo ========================================
echo.
echo 🚀 Ready to run: npm run dev
echo.
pause
