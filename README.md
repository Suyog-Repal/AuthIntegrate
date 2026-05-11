# AuthIntegrate

Production-ready monorepo with isolated frontend and backend apps.

## 🏗️ Project Structure

```bash
AuthIntegrate/
├── backend/         # Express + TypeScript + Drizzle ORM for Render
├── frontend/        # React + Vite + Tailwind for Vercel
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase PostgreSQL or any PostgreSQL-compatible database

### Environment Setup

#### Backend (`backend/.env`)
```env
DATABASE_URL=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASS=
FRONTEND_URL=
NODE_ENV=development
PORT=5000
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

### Installation
```bash
cd backend && npm install
cd ../frontend && npm install
```

### Local Development
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

### Production Builds
```bash
cd backend && npm run build
cd frontend && npm run build
```

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TailwindCSS, TanStack Query, Socket.IO client
- **Backend**: Express, Drizzle ORM, PostgreSQL, Socket.IO, JWT, Nodemailer
- **Deployment**: Vercel for frontend, Render for backend, Supabase for database

## 🔗 Deployment Notes
- **Frontend**: Deploy `frontend/` directly to Vercel
- **Backend**: Deploy `backend/` directly to Render
- **Database**: Connect backend to Supabase PostgreSQL with `DATABASE_URL`
- **CORS**: Backend reads `FRONTEND_URL` and allows Socket.IO connections

## ✅ Cleanup
- Removed root-level monorepo package files and shared folder dependency
- Kept frontend and backend fully self-contained for deployment
- Updated imports to use local shared schema within each app
