# AuthIntegrate Project - Codebase Exploration Summary

**Date:** April 11, 2026  
**Project:** Dual-Factor Authentication System with Hardware Integration  
**Tech Stack:** Express.js + React + Drizzle ORM + MySQL + Socket.io

---

## 📊 Executive Overview

**AuthIntegrate** is a dual-factor authentication system that combines hardware fingerprint recognition (ESP32/Arduino) with web-based account management. The system consists of:
- **Hardware Layer**: ESP32/Arduino device with fingerprint sensor
- **Backend**: Express.js API server with session management
- **Frontend**: React SPA with admin and user dashboards
- **Database**: MySQL with relational schema for users, profiles, and access logs
- **Real-time**: Socket.io for live access event broadcasting

---

## 🗄️ Database Schema

### Tables Structure

#### 1. **`users`** (Hardware-level registration)
```sql
- id: INT PRIMARY KEY
- finger_id: INT UNIQUE NOT NULL
- created_at: TIMESTAMP DEFAULT NOW()
```
**Purpose**: Tracks hardware registrations (fingerprint IDs assigned by ESP32)
**Key Note**: No password column (security fix applied)

#### 2. **`user_profiles`** (Web app user accounts)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- user_id: INT UNIQUE FOREIGN KEY → users.id (CASCADE DELETE)
- name: VARCHAR(255) NOT NULL
- email: VARCHAR(255) UNIQUE NOT NULL
- mobile: VARCHAR(20) OPTIONAL
- password_hash: TEXT NOT NULL (bcrypted)
- role: ENUM('admin', 'user') DEFAULT 'user'
- created_at: TIMESTAMP DEFAULT NOW()
```
**Purpose**: Web account profiles linked to hardware users

#### 3. **`access_logs`** (Event tracking)
```sql
- id: INT PRIMARY KEY AUTO_INCREMENT
- user_id: INT FOREIGN KEY → users.id (CASCADE DELETE)
- result: ENUM('GRANTED', 'DENIED', 'REGISTERED')
- note: VARCHAR(100) OPTIONAL
- created_at: TIMESTAMP DEFAULT NOW()
```
**Purpose**: Complete audit trail of all hardware access attempts + registrations

### Relationships
- **1:1** → users ↔ user_profiles (one hardware user per web account)
- **1:N** → users → access_logs (one user can have many access events)
- **1:N** → users → hardware events (fingerprint registrations)

---

## 🔐 Authentication & Authorization

### Session Management
- **Strategy**: Express-session with cookies
- **Session Secret**: `process.env.SESSION_SECRET` (required)
- **Cookie Configuration**:
  - `secure: false` (development mode)
  - `httpOnly: true` (prevents XSS attacks)
  - `sameSite: 'lax'` (CSRF protection)
  - `maxAge: 2 hours` (120 minutes)

### Authentication Flow

#### Registration (Web)
1. User must first register fingerprint on hardware (creates entry in `users` table with `finger_id`)
2. User submits registration form → `/api/auth/register`
3. Backend validates:
   - Hardware user ID exists (`users` table)
   - No existing profile for this user ID
   - Password is exactly 6 digits (numbers only)
4. Password is hashed with bcrypt (salt rounds: 10)
5. Profile created in `user_profiles` table with role='user' by default

**Constraints**:
```javascript
// Password must be exactly 6 digits
if (!data.password || !/^\d{6}$/.test(data.password)) {
  return res.status(400).json({ message: "6 digits required" });
}
```

#### Login (Web)
1. User submits email + password to `/api/auth/login`
2. Email lookup in `user_profiles` table
3. Bcrypt comparison of password with stored `password_hash`
4. Session regenerated and userId stored in session
5. `GET /api/auth/me` fetches complete user profile with role

#### Hardware Verification
- Endpoint: `POST /api/auth/verify_hardware`
- Input: `{ userId, password }`
- Purpose: Pre-validates credentials before hardware access attempts
- Result: Returns success if password matches stored hash

### Authorization Levels

**Admin Only**:
- `PUT /api/users/:id` - Modify user profile
- `GET /api/users` - View all users
- `DELETE /api/users/:id` - Delete user
- Access to Admin Dashboard

**Authenticated Users**:
- `GET /api/auth/me` - Current user profile
- `GET /api/logs` - Recent access logs (50 limit, all users for admins)
- `POST /api/auth/logout` - Session termination
- Access to User Dashboard

**Public**:
- `POST /api/auth/register` - Account creation
- `POST /api/auth/login` - Login
- `POST /api/auth/verify_hardware` - Hardware credential verification

### Middleware
- **`requireAuth`**: Checks `req.session.userId` exists
  - Returns 401 if missing
  - Passes to route handler for further checks

---

## 🔗 API Endpoints

### Authentication Routes

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/auth/register` | Public | Create web account (after hardware registration) |
| POST | `/api/auth/login` | Public | Login and create session |
| POST | `/api/auth/logout` | Auth | Destroy session |
| GET | `/api/auth/me` | Auth | Fetch current user profile |
| POST | `/api/auth/verify_hardware` | Public | Verify credentials before hardware access |

### System Stats & Monitoring

| Method | Endpoint | Access | Response |
|--------|----------|--------|----------|
| GET | `/api/stats` | Public | `{ totalUsers, totalAccessLogs, accessGrantedToday, accessDeniedToday, hardwareConnected }` |
| GET | `/api/logs` | Public | Recent 50 access logs with user profiles (enriched) |

### User Management (Admin Only)

| Method | Endpoint | Auth Level | Purpose |
|--------|----------|------------|---------|
| GET | `/api/users` | Admin | Fetch all users with profiles |
| PUT | `/api/users/:id` | Admin | Update user profile (name, email, mobile, role) |
| DELETE | `/api/users/:id` | Admin | Permanently remove user |

### Hardware Integration

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/api/hardware/event` | Public (Wi-Fi) | ESP32 sends fingerprint/access events |
| POST | `/api/hardware/simulate` | Auth | Manual test/simulate access events |

#### `/api/hardware/event` Payload Examples

**Registration** (New fingerprint):
```json
{
  "command": "REG",
  "userId": 1,
  "fingerId": 42,
  "result": "REGISTERED",
  "note": "New fingerprint registered via Wi-Fi"
}
```

**Access Attempt** (Verify fingerprint):
```json
{
  "command": "LOGIN",
  "userId": 1,
  "result": "GRANTED",
  "note": "Access granted - fingerprint match"
}
```

---

## 🔌 Socket.io Setup for Real-time Updates

### Server Configuration (routes.ts)
```typescript
const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" }
});
```

### Events Emitted

**1. `new-log`** - New access event recorded
- **Trigger**: Hardware event processed
- **Payload**: Single AccessLogWithUser object with user details
- **Subscribers**: Admin dashboard, optionally users
- **Behavior**: Enriches with user profile (name, email) before emit

**2. `hardware_status`** - Hardware connection status changed
- **Trigger**: Hardware service status change
- **Payload**: `{ connected: boolean }`
- **Subscribers**: Admin dashboard header status indicator

### Real-time Flow
```
ESP32 → POST /api/hardware/event
  ↓
hardwareService.processAccessEvent()
  ↓
emit('access_event') + emit('hardware_status_change')
  ↓
storage.createAccessLog() + io.emit('new-log')
  ↓
admin dashboard receives update (liveLogs state)
```

### Client Implementation
- Uses `socket.io-client` library
- Listener setup in AdminDashboard component
- Live logs maintained in React state + localStorage
- Frontend connects: `io(location.origin)`

---

## 💻 Frontend Structure (React/Vite)

### Routing (Wouter Router)

| Path | Component | Auth | Role | Purpose |
|------|-----------|------|------|---------|
| `/` | Home | - | - | Landing page |
| `/login` | Login | - | - | Account login |
| `/register` | Register | - | - | Account creation |
| `/dashboard/admin` | AdminDashboard | ✓ | Admin | System monitoring |
| `/dashboard/user` | UserDashboard | ✓ | Any | Personal access history |
| `/profile` | Profile | ✓ | Any | User profile management |

### Key Components

#### Pages
1. **Home.tsx** - Landing/intro page
2. **Login.tsx** - Email + password form → session creation
3. **Register.tsx** - Hardware ID + profile info form (6-digit password)
4. **UserDashboard.tsx** - Personal stats + access logs
5. **AdminDashboard.tsx** - System stats + all users + live logs + analytics
6. **Profile.tsx** - User profile edit/view

#### Components
- **Header.tsx** - Top navigation with hardware status indicator
- **StatsCards.tsx** - Display totalUsers, totalAccessLogs, etc.
- **LiveStatus.tsx** - Real-time hardware connection status
- **LogsTable.tsx** - Formatted access logs table with timestamps
- **UserTable.tsx** - Admin user management table
- **AnalyticsCharts.tsx** - Charts (recharts) for access trends
- **StatusBadge.tsx** - GRANTED/DENIED/REGISTERED color-coded badge
- **UI Components** - Radix UI shadcn/ui library (cards, buttons, inputs, etc.)

### State Management
- **React Query (@tanstack/react-query)**: Server state (users, logs, stats)
- **Context API**: AuthContext for current user + login/logout
- **React Hooks**: useState for UI state (loading, tables, modals)
- **localStorage**: Persist liveLogs between sessions

### Query Configuration
```javascript
queryClient = {
  // Auto-refetch stats every 5 seconds
  stats: { refetchInterval: 5000 },
  // Logs refetch every 3 seconds (admin)
  logs: { refetchInterval: 3000 },
  // User dashboard logs: staleTime=0, always refetch on mount
  "logs/user": { staleTime: 0, refetchOnMount: true }
}
```

### Protected Routes
```javascript
<ProtectedRoute component={AdminDashboard} adminOnly />
// Checks: isLoading → isAuthenticated → isAdmin
// Redirects to /login if not authenticated
// Redirects to /dashboard/user if user (not admin)
```

---

## 🛠️ Dependencies

### Backend Dependencies

**Core Framework**
- `express@^4.21.2` - HTTP server
- `http` - Node.js native (used for httpServer)

**Database & ORM**
- `drizzle-orm@^0.45.2` - Type-safe ORM
- `drizzle-kit@^0.31.10` - Drizzle CLI
- `mysql2@^3.6.0` - MySQL driver
- `@neondatabase/serverless@^1.0.2` - Serverless DB support (optional)

**Session & Security**
- `express-session@^1.18.2` - Session middleware
- `bcryptjs@^3.0.2` - Password hashing
- `bcrypt@^6.0.0` - Alternative bcrypt (both included)

**Real-time**
- `socket.io@^4.8.3` - WebSocket server
- `ws@^8.18.3` - WebSocket protocol

**Validation**
- `zod@^3.24.2` - Schema validation
- `drizzle-zod@^0.7.0` - Zod schemas from Drizzle

**Utilities**
- `dotenv@^17.2.3` - Environment variables
- `date-fns@^3.6.0` - Date utilities

**Serial Communication** (Hardware)
- `serialport@^13.0.0` - Serial port library
- `@serialport/parser-readline@^13.0.0` - Serial parser

### Frontend Dependencies

**Core Framework**
- `react@^18.3.1` - UI library
- `react-dom@^18.3.1` - DOM rendering
- `wouter@^3.7.1` - Client-side routing

**State Management & Data**
- `@tanstack/react-query@^5.60.5` - Server state management
- `axios@^1.12.2` - HTTP client
- `socket.io-client@^4.8.3` - WebSocket client

**Forms & Validation**
- `react-hook-form@^7.55.0` - Form state
- `@hookform/resolvers@^3.10.0` - Form validation adaptors
- `zod@^3.24.2` - Schema validation

**UI Components**
- `@radix-ui/*` - Headless UI components (20+ packages)
  - accordion, select, dropdown, dialog, toast, etc.
- `lucide-react@^0.546.0` - Icon library
- `recharts@^3.3.0` - Chart library

**Styling**
- `tailwindcss@^3.4.17` - CSS framework
- `postcss@^8.4.47` - CSS transformations
- `autoprefixer@^10.4.20` - CSS vendor prefixes
- `@tailwindcss/typography@^0.5.19` - Typography plugin
- `tailwind-merge@^2.6.0` - Merge Tailwind classes
- `tailwindcss-animate@^1.0.7` - Animation utilities
- `clsx@^2.1.1` - Classname utility
- `class-variance-authority@^0.7.1` - Component variants

**Animation**
- `framer-motion@^11.18.2` - Motion library

**Date/Time**
- `dayjs@^1.11.20` - Date library
- `date-fns@^3.6.0` - Date utilities

### Build Tools

**Development**
- `vite@^7.3.2` - Build tool
- `@vitejs/plugin-react@^4.7.0` - React plugin
- `tsx@^4.20.5` - TypeScript executor
- `typescript@5.6.3` - TypeScript

**Production Build**
- `esbuild@^0.25.0` - Fast bundler
- `terser@^5.46.1` - Code minification

**Other**
- `cross-env@^7.0.3` - Cross-platform env vars
- `@replit/vite-plugin-runtime-error-modal@^0.0.3` - Replit error modal

---

## 🔧 Environment Variables

### Required (Development & Production)

```bash
# DATABASE
DB_HOST=localhost                    # MySQL host
DB_USER=admin                        # MySQL user
DB_PASS=authintegrate123            # MySQL password
DB_NAME=authintegrate               # Database name
DATABASE_URL=mysql://...             # Full connection string

# SESSION
SESSION_SECRET=your-super-secret-key # CRITICAL: Change in production

# NODE
NODE_ENV=development|production      # Environment mode
PORT=5000                            # Server port (default)

# OPTIONAL: HARDWARE
HARDWARE_MODE=HTTP|SERIAL            # Communication mode
# HARDWARE_SERIAL_PORT=COM3         # Windows serial port
# HARDWARE_BAUD_RATE=115200         # Baud rate
```

### Computed/Derived Variables

- `VITE_MODE` - Vite development mode (set to 'development')
- Uses `process.env` in Node.js backend
- React frontend accesses via `import.meta.env` (Vite)

### Database Connection Retry Logic
```javascript
const dbConfig = {
  host: process.env.DB_HOST || "authintegrate-db.c9cw2...rds.amazonaws.com",
  connectTimeout: 5000,           // Fast failure detection
  waitForConnectionsMillis: 5000,
  keepAliveInitialDelayMs: 30000, // Connection pooling
  connectionLimit: 10,            // Max pool size
  queueLimit: 0                   // Unlimited queue
};

// Retry logic: MAX_RETRY_ATTEMPTS=3, RETRY_DELAY=2000ms
```

---

## 📝 User Registration Workflow

### Complete Registration Flow (Hardware → Web Account)

#### Step 1: Hardware Registration (On ESP32)
1. User places finger on sensor
2. Device captures fingerprint
3. Device assigns unique `userId` + `fingerId`
4. Device sends `POST /api/hardware/event`:
   ```json
   {
     "command": "REG",
     "userId": 1,
     "fingerId": 42,
     "result": "REGISTERED",
     "note": "First-time registration"
   }
   ```
5. Backend creates entry in `users` table:
   ```
   INSERT INTO users (id, finger_id) VALUES (1, 42)
   ```
6. Event logged to `access_logs` with result='REGISTERED'

#### Step 2: Web Account Creation
1. User navigates to `/register` page
2. Fills form with:
   - **Hardware User ID**: 1 (from hardware registration)
   - **Full Name**: "John Doe"
   - **Email**: "john@example.com"
   - **Mobile**: "+1-555-1234" (optional)
   - **Password**: "123456" (exactly 6 digits, numeric only)

3. Form submission: `POST /api/auth/register`
4. Backend validation:
   ```javascript
   // User must exist in hardware table
   if (!await storage.getUser(userId)) error()
   
   // No duplicate profile for this user
   if (await storage.getUserProfileByUserId(userId)) error()
   
   // Password validation
   if (!/^\d{6}$/.test(password)) error("Must be 6 digits")
   ```

5. Password is hashed: `bcrypt.hash(password, 10)`
6. Entry created in `user_profiles`:
   ```sql
   INSERT INTO user_profiles 
     (user_id, name, email, mobile, password_hash, role)
   VALUES (1, 'John Doe', 'john@example.com', '+1-555-1234', 
           '$2a$10$...[hashed]...', 'user')
   ```

7. Success response; user redirected to `/login`

#### Step 3: Account Login
1. User goes to `/login`
2. Enters email + password (now 6-digit PIN)
3. Backend flow:
   ```javascript
   const profile = await storage.getUserProfileByEmail(email)
   const valid = await bcrypt.compare(password, profile.password_hash)
   req.session.userId = profile.user_id
   ```
4. Enters dashboard based on role (admin/user)

#### Step 4: Hardware Access with Web Credentials
1. User places finger on sensor
2. Device verifies fingerprint → sends `POST /api/hardware/event`:
   ```json
   {
     "command": "LOGIN",
     "userId": 1,
     "result": "GRANTED"
   }
   ```
3. Backend processes:
   - Checks user exists
   - Logs to `access_logs`
   - Emits to Socket.io clients
   - Multi-factor: Fingerprint (hardware) ✓ + PIN (web) ✓

### Data Flow Diagram
```
User Registration (Hardware):
  Physical Fingerprint Scan
         ↓
    ESP32 Processing
         ↓
  POST /api/hardware/event (REG)
         ↓
  Create users(id, finger_id)
         ↓
  Emit "access_event" → Socket.io

User Registration (Web):
  /register Form Submission
         ↓
  POST /api/auth/register
         ↓
  Validate user exists + email unique
         ↓
  Hash password (bcrypt)
         ↓
  Create user_profiles record
         ↓
  Redirect to /login

User Login:
  Email + Password (6-digit PIN)
         ↓
  POST /api/auth/login
         ↓
  Verify password with bcrypt
         ↓
  Session created (2-hour cookie)
         ↓
  Redirect to /dashboard/user or /dashboard/admin

Hardware Access:
  Fingerprint Scan
         ↓
  POST /api/hardware/event (LOGIN)
         ↓
  Log to access_logs table
         ↓
  Emit "new-log" via Socket.io
         ↓
  AdminDashboard receives real-time update
```

---

## 🚀 Server Startup Flow

### Initialization Sequence

```
1. Load .env variables
2. Initialize Express app
3. Setup middleware (logging, json parser)
4. Connect to MySQL database (with retry)
5. Register all API routes
6. Setup Socket.io server
7. Attach Socket.io listeners
8. Start HTTP server with port retry logic
```

### Error Handling

#### Port Conflicts
- Server attempts to start on `PORT` (default 5000)
- If port in use: retry on `PORT+1` with exponential backoff
- Max retries: 5 attempts
- Backoff formula: `500 + (100 * attemptNumber)` ms

#### Database Connection Failures
- Max retries: 3 attempts, 2-second delay between retries
- Displays helpful error with setup instructions
- Suggests Docker containers or AWS RDS for production

#### Hardware Events
- Validates against esp32EventSchema (Zod)
- 400 error if schema invalid
- Prevents foreign key constraint errors (checks user exists before logging)

---

## 🏗️ Project Structure Summary

```
AuthIntegrate/
├── server/
│   ├── index.ts              # App entry + server startup
│   ├── routes.ts             # All API endpoints
│   ├── db.ts                 # MySQL connection pool
│   ├── storage.ts            # Database queries
│   ├── middleware/
│   │   └── auth.ts           # requireAuth middleware
│   └── services/
│       └── hardwareService.ts # Hardware event processor
│
├── client/
│   ├── src/
│   │   ├── App.tsx           # Router + auth provider
│   │   ├── main.tsx          # Vite entry
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx  # Auth state + login/logout
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── UserDashboard.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Home.tsx
│   │   │   └── not-found.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── LogsTable.tsx
│   │   │   ├── StatsCards.tsx
│   │   │   ├── UserTable.tsx
│   │   │   ├── AnalyticsCharts.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── LiveStatus.tsx
│   │   │   └── ui/ (Radix UI components)
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx
│   │   │   ├── use-toast.ts
│   │   │   └── use-relative-time.ts
│   │   ├── lib/
│   │   │   ├── queryClient.ts  # Axios + React Query config
│   │   │   └── utils.ts
│   │   └── index.css
│   ├── index.html
│   └── public/
│
├── shared/
│   └── schema.ts            # Database schema + Zod validation
│
├── package.json
├── tsconfig.json
├── vite.config.ts
├── drizzle.config.ts
├── .env.local.example
├── DATABASE_SETUP.md
└── QUICK_START.md
```

---

## 📊 Key Statistics

| Metric | Value |
|--------|-------|
| **API Endpoints** | 12+ routes |
| **Database Tables** | 3 (users, user_profiles, access_logs) |
| **Frontend Pages** | 7 (Home, Login, Register, Admin Dashboard, User Dashboard, Profile, 404) |
| **Components** | 8 main + 30+ UI components |
| **Real-time Events** | 2 (new-log, hardware_status) |
| **Session Duration** | 2 hours |
| **Password Policy** | 6 numeric digits (hardware users) |
| **Dependencies** | 100+ npm packages (including Radix UI, recharts) |
| **Authentication Factors** | 2 (Hardware fingerprint + Web PIN) |

---

## ✅ Key Implementation Highlights

### Security Features
✓ Bcryptjs password hashing (salt rounds: 10)  
✓ Session-based authentication with regeneration  
✓ CSRF protection (sameSite: lax)  
✓ XSS prevention (httpOnly cookies)  
✓ Role-based access control (admin/user)  
✓ Foreign key constraints with cascading deletes  

### Performance Features
✓ MySQL connection pooling (limit: 10)  
✓ React Query with staleTime + refetch intervals  
✓ Socket.io for real-time updates (avoid polling)  
✓ localStorage persistence for UI state  
✓ Auto-pagination of logs (50-entry limit)  

### Reliability Features
✓ Database retry logic (3 attempts, 2-second intervals)  
✓ Server port retry with exponential backoff  
✓ Session error handling + regeneration  
✓ Comprehensive error messages  
✓ Hardware event validation (Zod schemas)  

### UX Features
✓ Auto-redirect based on auth status  
✓ Role-based dashboard (admin vs user)  
✓ Real-time access log updates  
✓ Hardware connection status indicator  
✓ Responsive design (Tailwind + Radix UI)  
✓ Loading states + skeleton screens  

---

## 🔗 Important File References

- **Database Schema**: [shared/schema.ts](shared/schema.ts)
- **API Routes**: [server/routes.ts](server/routes.ts)
- **Authentication Context**: [client/src/contexts/AuthContext.tsx](client/src/contexts/AuthContext.tsx)
- **Admin Dashboard**: [client/src/pages/AdminDashboard.tsx](client/src/pages/AdminDashboard.tsx)
- **User Dashboard**: [client/src/pages/UserDashboard.tsx](client/src/pages/UserDashboard.tsx)
- **Environment Config**: [.env.local.example](.env.local.example)
- **Package Dependencies**: [package.json](package.json)

---

## 🎯 Next Steps for Development

1. **Environment Setup**: Copy `.env.local.example` to `.env.local` and configure
2. **Database**: Run `setup-local-db.sql` or follow `DATABASE_SETUP.md`
3. **Install Dependencies**: `npm install`
4. **Development**: `npm run dev` (Vite dev server + Express backend)
5. **Build**: `npm run build` (production bundles)
6. **Hardware Integration**: Configure serial port or use HTTP mode for testing

---

*Generated: April 11, 2026 | AuthIntegrate Project Analysis*
