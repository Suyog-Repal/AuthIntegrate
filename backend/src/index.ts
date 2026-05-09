import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import routes from "./routes";
import { errorHandler } from "./middleware/error";
import { hardwareService } from "./services/hardware.service";
import { logService } from "./services/log.service";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true,
}));
app.use(compression());
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
});
app.use("/api/", limiter);

// Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Socket.io logic
io.on("connection", (socket) => {
  console.log("Socket client connected:", socket.id);
  
  socket.on("disconnect", () => {
    console.log("Socket client disconnected:", socket.id);
  });
});

hardwareService.on("hardware_status_change", (connected: boolean) => {
  io.emit("hardware_status", { connected });
});

hardwareService.on("access_event", async (logData) => {
  try {
    await logService.createLog(logData);
    const logs = await logService.getRecentLogs(1);
    if (logs && logs.length > 0) {
      io.emit("new-log", logs[0]);
    }
  } catch (error) {
    console.error("Error processing access event:", error);
  }
});

// Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});