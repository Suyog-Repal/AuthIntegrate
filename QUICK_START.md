# ⚡ Quick Start Guide - Fix Database Connection Issue

## 🔴 Problem
```
Error: connect ETIMEDOUT
```
The app is trying to connect to a remote database but timing out.

## ✅ Solution (3 Steps)

### Step 1: Start MySQL Service
#### Windows:
1. Press `Win + R`
2. Type `services.msc` and press Enter
3. Find "MySQL94" (or "MySQL")
4. Right-click → Click "Start"
5. Wait 3 seconds

---

### Step 2: Setup Local Database
#### Quick Option (Recommended):
```bash
# In Command Prompt (run as Administrator):
cd path\to\AuthIntegrate
mysql -u root -p < setup-local-db.sql
```
When prompted for password, try: (just press Enter or your MySQL root password)

#### Manual Option:
```bash
# Open MySQL Command Line
mysql -u root -p

# Paste these commands:
CREATE DATABASE IF NOT EXISTS authintegrate;
USE authintegrate;
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'authintegrate123';
GRANT ALL PRIVILEGES ON authintegrate.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;
```

Then open file: `setup-local-db.sql` and copy all content after "Create users table" and paste into MySQL

---

### Step 3: Run the App
```bash
npm run dev
```

Expected output:
```
🔄 Attempting database connection (attempt 1/3)...
   Host: localhost
✅ Connected to MySQL successfully!
```

---

## 🆘 Still Not Working?

### Error: "Access denied for user 'root'"
- Your MySQL needs a password
- Try: `mysql -u root -p` then enter password when prompted in setup

### Error: "Can't connect to MySQL server"
- MySQL service not running
- Go back to Step 1 and start the service

### Error: "Database authintegrate doesn't exist"
- Setup script didn't run properly
- Manually run the SQL commands (Manual Option above)

---

## 📁 Files Created to Help You

- **`DATABASE_SETUP.md`** - Detailed setup instructions
- **`setup-local-db.sql`** - SQL script to create tables
- **`.env`** - Already updated to use `localhost`
- **`setup-db.bat`** - Batch script (Windows)

---

## 🚀 Next Steps After App Starts

Once you see "✅ Connected to MySQL successfully!":

1. Open browser: `http://localhost:5000`
2. You should see the login page
3. Start using the app!

---

## 🌐 For Production (AWS RDS)

When deploying to production:

1. Create AWS RDS MySQL instance
2. Get the RDS endpoint (e.g., `mydb.c9cw2wye62zf.ap-south-1.rds.amazonaws.com`)
3. Update `.env`:
   ```
   DB_HOST=your-rds-endpoint.ap-south-1.rds.amazonaws.com
   DB_USER=your_admin_user
   DB_PASS=your_strong_password
   DB_NAME=authintegrate
   ```
4. Ensure security group allows MySQL (port 3306)

---

## ❓ Need Help?

See: `DATABASE_SETUP.md` in the project root

Happy coding! 🚀
