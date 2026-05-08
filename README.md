# AuthIntegrate

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)

A complete, production-ready full-stack authentication system that integrates hardware (ESP32 fingerprint sensor) with a modern web interface. The system handles dual-factor authentication flows, real-time access monitoring, role-based dashboards, and comprehensive logging with export capabilities.

## 🚀 Features

### 🔐 Dual-Factor Authentication
- **Hardware Integration**: ESP32 fingerprint sensor for biometric authentication
- **Web Registration**: Complete user profiles with email, mobile, and role management
- **Secure Sessions**: Session-based authentication with bcrypt password hashing

### 📊 Real-Time Monitoring & Analytics
- **Live Access Logs**: Real-time updates via Socket.io for access events
- **Advanced Filtering**: Filter logs by date, status, user ID, and search terms
- **Analytics Dashboard**: Interactive charts showing access patterns and statistics
- **Export Functionality**: Export logs to Excel (.xlsx) and PDF formats

### 👥 Role-Based Access Control
- **Admin Dashboard**: Comprehensive system overview with user management
- **User Dashboard**: Personalized access history and profile management
- **Permission Levels**: Admin and user roles with appropriate access controls

### 📧 Communication & Notifications
- **Email Notifications**: Automated registration confirmations and password reset emails
- **Password Reset System**: Secure token-based password recovery
- **SMTP Integration**: Support for Gmail and custom SMTP providers

### 🔧 Hardware Integration
- **Serial Communication**: Direct communication with ESP32 via SerialPort
- **Event Processing**: Real-time processing of hardware events (GRANTED/DENIED/REGISTERED)
- **Status Monitoring**: Live hardware connection status and diagnostics

### 🎨 Modern User Interface
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Library**: Radix UI primitives for consistent, accessible components
- **Interactive Charts**: Recharts for data visualization
- **Real-Time Updates**: Live status indicators and notifications

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js with ES6 modules
- **Framework**: Express.js with TypeScript
- **Database**: MySQL with Drizzle ORM and connection pooling
- **Authentication**: Session-based with express-session
- **Real-Time**: Socket.io for live updates
- **Hardware**: SerialPort for ESP32 communication
- **Email**: Nodemailer with SMTP support
- **Security**: bcryptjs, CORS, environment variables

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI + Lucide React icons
- **State Management**: React Context + custom hooks
- **Charts**: Recharts for analytics visualization
- **Routing**: Wouter for lightweight client-side routing

### Database Schema
- **Users Table**: Hardware user data (ID, fingerprint ID, password)
- **Access Logs Table**: Real-time access events with timestamps
- **User Profiles Table**: Web user profiles with email and role information
- **Optimized Indexes**: Performance-optimized database queries

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MySQL** (v8.0 or higher)
- **ESP32** with fingerprint sensor (optional for hardware features)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/AuthIntegrate.git
cd AuthIntegrate
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
#### Start MySQL Service (Windows)
```bash
# Press Win + R, type services.msc
# Find "MySQL" service and start it
```

#### Setup Database
```bash
# Run the database setup script
mysql -u root -p < setup-local-db.sql
```

### 4. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_USER=admin
DB_PASSWORD=authintegrate123
DB_NAME=authintegrate

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-here

# Email Configuration (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=gmail

# Hardware Configuration (optional)
SERIAL_PORT=COM3  # Windows
# SERIAL_PORT=/dev/ttyUSB0  # Linux/Mac
```

### 5. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 📖 Usage

### Web Interface
1. **Registration**: Users first register via hardware (ESP32), then complete web registration
2. **Login**: Authenticate using fingerprint + web credentials
3. **Dashboard**: Access role-specific dashboards with personalized features
4. **Admin Panel**: Manage users, view analytics, and monitor access logs

### Hardware Integration
- Connect ESP32 with fingerprint sensor to your computer
- The system automatically detects and processes hardware events
- Real-time status updates appear in the admin dashboard

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Initiate password reset
- `POST /api/auth/reset-password` - Reset password with token

#### User Management
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/:id` - Update user profile (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

#### Logs & Analytics
- `GET /api/logs` - Get access logs with filtering
- `GET /api/logs/export/excel` - Export logs to Excel
- `GET /api/logs/export/pdf` - Export logs to PDF
- `GET /api/stats` - Get system statistics

#### Hardware Integration
- `POST /api/hardware/event` - Process hardware events
- `GET /api/hardware/status` - Get hardware connection status

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # TypeScript type checking
npm run db:push      # Push database schema changes
```

### Project Structure
```
AuthIntegrate/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── contexts/      # React contexts
│   │   └── lib/           # Utilities and configurations
├── server/                 # Express backend
│   ├── middleware/        # Express middleware
│   ├── services/          # Business logic services
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   └── index.ts           # Server entry point
├── shared/                 # Shared types and schemas
├── migrations/            # Database migrations
├── scripts/               # Utility scripts
└── docs/                  # Documentation
```

## 🚀 Production Deployment

### Build Process
```bash
npm run build
```

### Environment Setup
- Set `NODE_ENV=production` in environment variables
- Configure production database (AWS RDS recommended)
- Set up SMTP email service
- Configure domain and SSL certificates

### Server Deployment
The application is designed to run on cloud platforms like AWS EC2, DigitalOcean, or Heroku with proper static file serving and API proxying.

### Docker Support
The application includes Docker configuration for containerized deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure mobile responsiveness for UI changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **ESP32 Community** for hardware integration resources
- **Radix UI** for accessible component primitives
- **Tailwind CSS** for utility-first styling
- **Socket.io** for real-time communication
- **Drizzle ORM** for type-safe database operations

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation in the `docs/` directory
- Review the troubleshooting guides in the repository

---

**Built with ❤️ using modern web technologies and hardware integration**</content>
<parameter name="filePath">e:\Suyog\Semester_Labs\Sem V\sem v projects\AuthIntegrate\README.md