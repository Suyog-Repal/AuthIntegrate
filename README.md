# AuthIntegrate

Professional Production-Ready Architecture with Separate Frontend and Backend.

## 🏗️ Project Structure

```bash
AuthIntegrate/
│
├── frontend/        # React + Vite + TS (Vercel)
├── backend/         # Express + Drizzle + PG (Render)
├── shared/          # Shared Schema & Types
└── docs/            # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL (Supabase recommended)

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
npm run install:all
```

### Development
```bash
# Start Backend
npm run dev:backend

# Start Frontend
npm run dev:frontend
```

## 🛠️ Tech Stack
- **Frontend**: React, Vite, TailwindCSS, shadcn/ui, TanStack Query, Axios.
- **Backend**: Express, TypeScript, Drizzle ORM, PostgreSQL, JWT, Nodemailer.
- **Security**: Helmet, CORS, Rate Limiting, Centralized Error Handling.

## 🔗 Deployment
- **Frontend**: Deploy `frontend/` to Vercel.
- **Backend**: Deploy `backend/` to Render.
- **Database**: Use Supabase PostgreSQL.