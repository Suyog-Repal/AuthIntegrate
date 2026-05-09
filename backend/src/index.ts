import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import net from "net";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/error.js";
import { hardwareService } from "./services/hardware.service.js";
import { logService } from "./services/log.service.js";

// Load environment variables
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// ==========================================
// MIDDLEWARE STACK
// ==========================================
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use("/api/", limiter);

// ==========================================
// ROUTES & API
// ==========================================
app.use("/api", routes);

app.get("/health", (_req, res) => {
  res.status(200).json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==========================================
// SOCKET.IO & REAL-TIME LOGIC
// ==========================================
io.on("connection", (socket) => {
  console.log("📡 Socket client connected:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("🔌 Socket client disconnected:", socket.id);
  });
});

// Broadcast hardware status changes to all connected web clients
hardwareService.on("hardware_status_change", (connected: boolean) => {
  io.emit("hardware_status", { connected });
});

// Process real-time access events from hardware
hardwareService.on("access_event", async (logData) => {
  try {
    // 1. Persist the log to PostgreSQL
    await logService.createLog(logData);
    
    // 2. Fetch the enriched log (with user/profile info) for the frontend
    const logs = await logService.getLogsWithFilters({ limit: 1 });
    if (logs && logs.length > 0) {
      // 3. Emit to all web dashboards
      io.emit("new-log", logs[0]);
    }
  } catch (error) {
    console.error("❌ Error processing real-time access event:", error);
  }
});

// ==========================================
// ERROR HANDLING
// ==========================================
app.use(errorHandler);

/**
 * PRODUCTION-GRADE PORT MANAGEMENT
 * Utility to probe for an available port before attempting to bind the main server.
 * This prevents ERR_SERVER_ALREADY_LISTEN by ensuring the server only calls listen() once.
 */
const findAvailablePort = (startPort: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    const tester = net.createServer();
    
    tester.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Port taken, recursively check next one
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });

    tester.once('listening', () => {
      // Port is free, close the tester and return the port number
      tester.close(() => resolve(startPort));
    });

    tester.listen(startPort);
  });
};

/**
 * SERVER BOOTSTRAP
 * Standard entry point for scalable production applications.
 */
async function startServer() {
  try {
    const preferredPort = Number(process.env.PORT) || 5000;
    const port = await findAvailablePort(preferredPort);

    httpServer.listen(port, () => {
      console.log(`\n-----------------------------------------`);
      console.log(`🚀 AuthIntegrate Backend is Online`);
      console.log(`🔗 URL: http://localhost:${port}`);
      console.log(`🛠️  Mode: ${process.env.NODE_ENV || 'development'}`);
      console.log(`-----------------------------------------\n`);
    });

    // --- Graceful Shutdown ---
    const shutdown = (signal: string) => {
      console.log(`\n🛑 ${signal} received. Closing HTTP server...`);
      httpServer.close(() => {
        console.log('✅ HTTP server closed. Process exiting.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error("❌ Critical Failure during server bootstrap:", error);
    process.exit(1);
  }
}

startServer();