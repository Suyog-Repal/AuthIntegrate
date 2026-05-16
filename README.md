<div align="center">

  <img src="./auth_integrate_hero_banner.png" alt="AuthIntegrate Hero Banner" width="100%" />

  # 🔐 AuthIntegrate

  **The Ultimate Fusion of Biometrics, Real-time IoT, and Modern Web Security.**

  [![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://auth-integrate.vercel.app)
  [![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
  [![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

  [Explore Docs](#-getting-started) • [Live Demo](https://auth-integrate.vercel.app) • [Report Bug](https://github.com/Suyog-Repal/AuthIntegrate/issues)

</div>

---

Whether you're securing a web app or an entire physical office, AuthIntegrate provides the tools to manage users, monitor hardware events in real-time, and generate comprehensive security reports.

---

## 🎯 Problem Statement

Traditional authentication systems only secure digital access, leaving physical entry points vulnerable or disconnected from the digital identity. **AuthIntegrate** bridges this gap by combining biometric hardware verification with a modern web-based security infrastructure.

- **The Challenge**: Traditional keys or cards can be lost, stolen, or shared.
- **The Solution**: Biometric (Fingerprint) authentication ensures the person accessing the physical space is the same person authenticated in the digital system.
- **The Impact**: A unified, real-time security ecosystem that scales from small offices to enterprise-grade facilities.

---


---

## ✨ Key Features

- **🛡️ Secure Authentication**: JWT-based auth with high-entropy password hashing (Bcrypt).
- **📟 Biometric Integration**: Seamless connection with ESP32 and Fingerprint sensors for physical access control.
- **⚡ Real-time Synchronization**: Instant hardware event updates via Socket.IO.
- **📊 Advanced Analytics**: Interactive dashboards with Recharts for visualizing access logs.
- **📄 Report Generation**: Export detailed access logs and user activities to PDF and Excel.
- **📧 Smart Notifications**: Automated transactional emails using Resend and Nodemailer.
- **🎨 Premium UI/UX**: A gorgeous, responsive interface built with Shadcn/UI, Tailwind CSS, and Framer Motion.
- **🏗️ Production Ready**: Fully optimized for deployment on Vercel (Frontend) and Render (Backend).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Communication**: Socket.io-client & Axios
- **Form Handling**: React Hook Form + Zod

### Backend
- **Runtime**: Node.js (TypeScript)
- **Framework**: Express.js
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL (Supabase)
- **Real-time**: Socket.io
- **Emailing**: Resend & Nodemailer
- **Reports**: jsPDF & SheetJS (XLSX)

### Hardware
- **Controller**: ESP32
- **Sensor**: AS608 Fingerprint Module
- **Protocol**: HTTP/HTTPS + WebSockets

---

## 🏗️ System Architecture

```mermaid
graph TD
    subgraph "Client Layer"
        User[Web User]
        Browser[React Frontend / Vite]
    end

    subgraph "Server Layer (Node.js)"
        API[Express.js API]
        Socket[Socket.IO Server]
        Auth[JWT / Bcrypt Auth]
    end

    subgraph "Data Layer"
        DB[(PostgreSQL / Supabase)]
        Drizzle[Drizzle ORM]
    end

    subgraph "Hardware Layer (IoT)"
        ESP32[ESP32 Microcontroller]
        Sensor[Fingerprint Sensor AS608]
    end

    User --> Browser
    Browser <--> |REST API / JWT| API
    Browser <--> |WebSockets| Socket
    API <--> Drizzle
    Drizzle <--> DB
    Socket <--> ESP32
    ESP32 <--> Sensor
    ESP32 --> |X-API-KEY Auth| API
```

---

## 🔒 Security Features

AuthIntegrate is built with a security-first mindset, ensuring data integrity across both web and hardware interfaces.

- **🛡️ JWT Authentication**: Stateless session management with secure token exchange.
- **🔑 Bcrypt Hashing**: High-entropy password storage with automated salting.
- **📡 Hardware API Security**: Requests from ESP32 are validated via `X-API-KEY` headers to prevent unauthorized hardware events.
- **🔄 Secure Password Reset**: Token-based recovery flow with strict expiration windows.
- **🛡️ Rate Limiting & Helmet**: Protection against Brute-Force and common web vulnerabilities.
- **✅ Zod Validation**: Strict schema-based validation for every API endpoint.
- **🌐 CORS Policy**: Controlled access restricted to authorized frontend domains.


---

## 📸 Project Preview

<div align="center">
  <h3>🖥️ Web Dashboard</h3>
  <img src="./dashboard.png" alt="Dashboard Preview" width="800px" />
  
  <br/>
   <img src="./admin_dashboard.png" alt="Dashboard Preview" width="800px" />
  
  <br/>
  <h3>🔌 Hardware Setup</h3>
  <img src="./hardware_setup.png" alt="Hardware Setup" width="800px" />
  <p><i>The hardware setup consists of an ESP32 microcontroller, a fingerprint sensor, and indicator LEDs.</i></p>
</div>

---

## 🏗️ Project Structure

```bash
AuthIntegrate/
├── backend/         # Node.js + Express + Drizzle ORM (API & Socket Server)
├── frontend/        # React + Vite + Tailwind (Web Interface)
├── hardware/        # C++/Arduino code for ESP32 & Fingerprint Sensor
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/Suyog-Repal/AuthIntegrate.git
cd AuthIntegrate
```

### 2. Backend Setup
```bash
cd backend
npm install
# Configure your .env file (see below)
npm run db:push
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
# Configure your .env file (see below)
npm run dev
```

---

## ⚙️ Environment Configuration

### Backend (`backend/.env`)
| Variable | Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string (Supabase) |
| `JWT_SECRET` | Secret key for JWT signing |
| `RESEND_API_KEY` | API key for Resend email service |
| `FRONTEND_URL` | URL of the frontend (for CORS) |
| `PORT` | Port for the backend server (default: 5000) |

### Frontend (`frontend/.env`)
| Variable | Description |
| :--- | :--- |
| `VITE_API_URL` | Base URL of the Backend API |
| `VITE_SOCKET_URL` | URL of the Backend Socket server |

---

## ☁️ Deployment Architecture

The project is architected for high availability and seamless scalability across modern cloud platforms.

| Service | Platform | Purpose |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Edge-optimized React hosting |
| **Backend** | [Render](https://render.com) | Scalable Node.js runtime |
| **Database** | [Supabase](https://supabase.com) | Managed PostgreSQL instance |
| **Emails** | [Resend](https://resend.com) | Transactional email delivery |
| **Real-time** | [Socket.io](https://socket.io) | Bidirectional hardware communication |


---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with ❤️ by <b>Suyog Repal</b></p>
  <a href="https://github.com/Suyog-Repal">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white" />
  </a>
</div>
