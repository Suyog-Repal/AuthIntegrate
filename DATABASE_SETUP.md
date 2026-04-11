# 🗄️ Database Setup Guide for AuthIntegrate

## ❌ Current Issue
The app is trying to connect to an AWS RDS database at:
```
authintegrate-db.c9cw2wye62zf.ap-south-1.rds.amazonaws.com
```

But the connection is timing out because:
- The RDS instance may not be running
- Security group doesn't allow inbound connections
- Or the database doesn't exist

## ✅ Solution: Use Local MySQL for Development

### Option 1: Quick Setup (MySQL Workbench - GUI)

1. **Open MySQL Workbench**
   - Click "MySQL Connections"
   - Click the "+" icon to create new connection
   - Connection Name: `localhost`
   - Hostname: `127.0.0.1`
   - Username: `root`
   - Password: (Your MySQL root password)

2. **Run SQL Setup Script**
   - Download or open: [setup-local-db.sql](./setup-local-db.sql)
   - Copy all contents
   - Paste into Workbench query window
   - Click Execute (⚡ button)

3. **Update .env File**
   Replace these lines:
   ```
   DB_HOST=localhost
   DB_USER=admin
   DB_PASS=authintegrate123
   DB_NAME=authintegrate
   ```

4. **Start the app**
   ```bash
   npm run dev
   ```

---

### Option 2: Manual Command Line Setup

#### Step 1: Connect to MySQL as Root
```bash
mysql -u root -p
# Enter your MySQL root password
```

#### Step 2: Run the Setup Commands
```sql
-- Create database
CREATE DATABASE IF NOT EXISTS authintegrate;
USE authintegrate;

-- Create admin user
CREATE USER IF NOT EXISTS 'admin'@'localhost' IDENTIFIED BY 'authintegrate123';
GRANT ALL PRIVILEGES ON authintegrate.* TO 'admin'@'localhost';
FLUSH PRIVILEGES;

-- Create tables (paste the rest from setup-local-db.sql)
```

#### Step 3: Exit and Update .env
```bash
# Press Ctrl+D or type: exit
```

Then update `.env`:
```
DB_HOST=localhost
DB_USER=admin
DB_PASS=authintegrate123
DB_NAME=authintegrate
```

---

### Option 3: Use the Setup Script Directly
```bash
# If you know your root password:
mysql -u root -p < setup-local-db.sql

# Or create a new user for development:
mysql -u root -p -e "CREATE USER 'dev'@'localhost' IDENTIFIED BY 'dev123'; GRANT ALL ON authintegrate.* TO 'dev'@'localhost';"

# Then update .env with:
# DB_USER=dev
# DB_PASS=dev123
```

---

## 🔑 Troubleshooting

### "ERROR 1045: Access denied for user 'root'"
- Your MySQL root has a password
- Try: `mysql -u root -p` then enter password

### "ERROR 2003: Can't connect to MySQL server"
- MySQL service is not running
- **Windows**: Open Services → Start "MySQL94" (or MySQL version you have)
- **Mac**: Use System Preferences → MySQL Start
- **Linux**: `sudo systemctl start mysql`

### "Can't find authintegrate database"
Run setup-local-db.sql or the SQL commands above

---

## ✅ After Setup

Run the app:
```bash
npm run dev
```

Expected output:
```
Hardware service initialized in STANDALONE HTTP MODE
🔄 Attempting database connection (attempt 1/3)...
✅ Connected to MySQL successfully!
```

---

## 📝 Notes

- The `setup-local-db.sql` file creates all necessary tables
- Default credentials: `admin` / `authintegrate123`
- Timezone is set to IST (+05:30)
- All changes are logged in `access_logs` table

---

## 🌐 For AWS RDS Production

When ready for production:
1. Create RDS instance in AWS
2. Update `.env` with RDS credentials:
   ```
   DB_HOST=your-rds-endpoint.rds.amazonaws.com
   DB_USER=your_admin_user
   DB_PASS=your_strong_password
   ```
3. Ensure security group allows MySQL port 3306
4. Run: `npm run dev` (it will connect to RDS)
