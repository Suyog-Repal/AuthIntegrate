import express, { Request, Response } from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
import { hardwareService } from "./services/hardware.service.js";
import { logService } from "./services/log.service.js";
import cookieParser from "cookie-parser";
import { AccessEventData } from "./types/index.js";

// ==========================================
// ENVIRONMENT CONFIGURATION
// ==========================================
dotenv.config();

const isDev = process.env.NODE_ENV !== "production";

// ==========================================
// STARTUP ENVIRONMENT VALIDATION
// Fail fast with clear errors before binding to a port.
// ==========================================
function validateEnvironment(): void {
  const required: Record<string, string | undefined> = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET:   process.env.JWT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL,
  };

  const missing = Object.entries(required)
    .filter(([, val]) => !val)
    .map(([key]) => key);

  if (missing.length > 0) {
    if (!isDev) {
      console.error(`❌ [FATAL] Missing required environment variables in production:\n  - ${missing.join("\n  - ")}`);
      console.error("   Set these in your Render dashboard (Environment tab) before deploying.");
      process.exit(1);
    } else {
      console.warn(`⚠️  [ENV] Missing optional vars for dev: ${missing.join(", ")} (acceptable locally)`);
    }
  }

  // HARDWARE_API_KEY is required in production
  if (!process.env.HARDWARE_API_KEY && !isDev) {
    console.error("❌ [FATAL] HARDWARE_API_KEY is required in production.");
    process.exit(1);
  }

  if (!isDev) {
    console.log("✅ Environment validation passed.");
  }
}

validateEnvironment();

// ==========================================
// CORS ORIGINS
// ==========================================
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no Origin header (curl, Postman, hardware devices, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
};

// ==========================================
// APP & HTTP SERVER
// ==========================================
const app = express();
const httpServer = createServer(app);

// ==========================================
// SOCKET.IO — HARDENED CONFIGURATION
// ==========================================
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
  // Support both websocket and polling (critical for Render + Vercel)
  transports: ["websocket", "polling"],
  // Ping settings to keep connections alive through Render's load balancer
  pingTimeout: 60000,
  pingInterval: 25000,
  // Allow reconnection to work cleanly
  allowEIO3: true,
});

// ==========================================
// MIDDLEWARE STACK
// ==========================================
app.set("trust proxy", 1); // Required for Render (behind a reverse proxy)
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
// Use 'combined' in production for structured logs; 'dev' locally for colour
app.use(morgan(isDev ? "dev" : "combined"));
app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// ==========================================
// RATE LIMITING
// ==========================================
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDev ? 5000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again later." },
});

app.use("/api/auth", authLimiter);
app.use("/api", apiLimiter);

// ==========================================
// HEALTH CHECK (Render uses this)
// ==========================================
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "AuthIntegrate Backend",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
  });
});

// ==========================================
// ROUTES & API
// ==========================================
app.use("/api", routes);

// ==========================================
// SOCKET.IO — REAL-TIME LOGIC
// ==========================================
io.on("connection", (socket) => {
  if (isDev) console.log("📡 Socket client connected:", socket.id);

  socket.on("disconnect", (reason: string) => {
    if (isDev) console.log(`🔌 Socket client disconnected: ${socket.id} (${reason})`);
  });

  socket.on("error", (err: Error) => {
    console.error("⚠️  Socket error:", err.message);
  });
});

// Broadcast hardware status changes to all connected web clients
hardwareService.on("hardware_status_change", (connected: boolean) => {
  io.emit("hardware_status", { connected });
});

// Process real-time access events from hardware
hardwareService.on("access_event", async (logData: AccessEventData) => {
  if (isDev) {
    console.log(
      `[SOCKET] access_event: userId=${logData.userId}, result=${logData.result}, note=${logData.note}`
    );
  }
  try {
    const insertedLog = await logService.createLog(logData);
    if (isDev) console.log(`[SOCKET] Log inserted with ID: ${insertedLog[0]?.id}`);

    const logs = await logService.getLogsWithFilters({ limit: 1 });
    if (logs && logs.length > 0) {
      if (isDev) console.log(`[SOCKET] Emitting new-log to ${io.sockets.sockets.size} clients`);
      io.emit("new-log", logs[0]);
    }
  } catch (error) {
    console.error("❌ Error processing real-time access event:", error);
  }
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use(errorHandler);

// ==========================================
// SERVER BOOTSTRAP
// ==========================================
async function startServer() {
  try {
    // Render injects PORT dynamically — we must respect it exactly
    const PORT = Number(process.env.PORT) || 5010;

    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`\n-----------------------------------------`);
      console.log(`🚀 AuthIntegrate Backend is Online`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🛠️  Mode: ${process.env.NODE_ENV || "development"}`);
      console.log(`-----------------------------------------\n`);
    });

    // Graceful shutdown — critical for Render zero-downtime deploys
    const shutdown = (signal: string) => {
      console.log(`\n🛑 ${signal} received. Closing HTTP server...`);
      io.close(() => {
        httpServer.close(() => {
          console.log("✅ HTTP server closed. Process exiting.");
          process.exit(0);
        });
      });
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Catch unhandled promise rejections to prevent silent crashes
    process.on("unhandledRejection", (reason) => {
      console.error("❌ Unhandled Promise Rejection:", reason);
      if (!isDev) process.exit(1);
    });

  } catch (error) {
    console.error("❌ Critical failure during server bootstrap:", error);
    process.exit(1);
  }
}

startServer();