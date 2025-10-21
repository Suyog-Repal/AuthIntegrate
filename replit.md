# Dual-Factor Authentication System

## Overview

This is a full-stack dual-factor authentication system that integrates hardware (ESP32 fingerprint sensors) with a modern web interface. The system manages user authentication through both fingerprint and password verification, providing real-time monitoring of access events and comprehensive user management capabilities. The application features role-based access control (admin/user), live hardware status monitoring via WebSocket, and analytics dashboards for tracking authentication patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool for fast development and optimized production builds
- Wouter for client-side routing (lightweight alternative to React Router)

**UI Component Strategy**
- shadcn/ui component library built on Radix UI primitives for accessibility
- Tailwind CSS with custom design system following modern SaaS dashboard patterns (inspired by Linear, Vercel, Stripe)
- Custom theming with dark mode support, using CSS variables for dynamic color schemes
- Design emphasizes clarity, security professionalism, and role-based visual hierarchy

**State Management**
- React Context API for authentication state (AuthContext)
- TanStack Query (React Query) for server state management with automatic caching and refetching
- WebSocket integration for real-time hardware events and access log updates

**Form Handling**
- React Hook Form for performant form state management
- Zod schema validation integrated via @hookform/resolvers for type-safe validation

### Backend Architecture

**Runtime & Framework**
- Node.js with ES modules (type: "module" in package.json)
- Express.js with modular route architecture
- Session-based authentication using express-session (no JWT)

**API Design**
- RESTful endpoints organized by resource type (auth, users, logs, stats)
- Middleware-based authentication with requireAuth guards
- WebSocket server for bidirectional real-time communication with clients

**Security Measures**
- bcryptjs for password hashing
- Session cookies with secure flags in production
- Mandatory SESSION_SECRET environment variable validation
- CORS configuration for cross-origin requests

**Hardware Integration Service**
- HardwareService class using EventEmitter pattern for real-time events
- Designed to interface with ESP32 via SerialPort (currently in simulation mode)
- Event-driven architecture for processing fingerprint authentication results

### Database Architecture

**ORM & Database**
- Drizzle ORM for type-safe database operations with PostgreSQL
- Neon serverless PostgreSQL client for connection pooling
- Schema-first approach with TypeScript type generation

**Data Model**
- **users**: Hardware user records from ESP32 (id, fingerId, password)
- **userProfiles**: Web application profiles linked to hardware users (email, mobile, passwordHash, role)
- **accessLogs**: Authentication event tracking (userId, result, note, timestamp)
- Enums for access results (GRANTED, DENIED, REGISTERED) and user roles (admin, user)

**Schema Relationships**
- One-to-one relationship between users and userProfiles via userId
- One-to-many relationship between users and accessLogs
- Cascade deletes to maintain referential integrity

**Data Access Layer**
- Storage interface (IStorage) defining all database operations
- DatabaseStorage implementation using Drizzle queries
- Type-safe query builders with support for joins, filters, and aggregations

### Authentication & Authorization

**Dual Registration Flow**
1. Hardware registration: ESP32 captures fingerprint and assigns userId
2. Web registration: Users create profile linked to hardware userId with email/password

**Session Management**
- Server-side sessions stored via express-session
- 2-hour session timeout with configurable security settings
- Session data includes userId for authenticated requests

**Role-Based Access Control**
- Admin role: Full system access, user management, complete analytics
- User role: Personal dashboard, own access history, profile management
- Route-level protection with ProtectedRoute component and requireAuth middleware

### Real-Time Communication

**WebSocket Architecture**
- WebSocket server integrated with HTTP server
- Clients receive live updates for access events and hardware status
- Event types: "access_log" for new authentication events, "hardware_status" for connection state

**Data Flow**
1. Hardware service emits access events
2. Server broadcasts via WebSocket to all connected clients
3. Frontend updates UI reactively without polling

## External Dependencies

### Core Infrastructure
- **@neondatabase/serverless**: Serverless PostgreSQL connection pooling for Neon database
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **ws**: WebSocket library for real-time bidirectional communication

### Backend Services
- **express**: Web application framework
- **express-session**: Session middleware for authentication state
- **bcryptjs**: Password hashing and verification
- **connect-pg-simple**: PostgreSQL session store (configured but may need activation)

### Frontend Libraries
- **@tanstack/react-query**: Async state management for server data
- **@radix-ui/***: Headless UI primitives for accessible components
- **recharts**: Charting library for analytics visualizations
- **date-fns**: Date formatting and manipulation
- **lucide-react**: Icon library
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority & clsx**: Dynamic className composition

### Development Tools
- **vite**: Frontend build tool and dev server
- **tsx**: TypeScript execution for development
- **esbuild**: JavaScript bundler for production backend
- **drizzle-kit**: Database migration and schema management

### Planned Integration
- **SerialPort**: Hardware communication with ESP32 fingerprint sensors (currently simulated)