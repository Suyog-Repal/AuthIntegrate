import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import { hardwareService } from "./services/hardwareService";
import { loginSchema, insertUserProfileSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // ==================== SESSION SETUP ====================
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET must be set in environment variables");
  }
  app.use(
    session({
      secret: process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 2 * 60 * 60 * 1000, // 2 hours
      },
    })
  );

  // ==================== AUTHENTICATION ROUTES ====================
  // Register new user profile
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserProfileSchema.parse(req.body);

      const user = await storage.getUser(data.userId);
      if (!user) {
        return res.status(400).json({
          message: "User not found in hardware database. Please ensure fingerprint registration first.",
        });
      }

      const existingProfile = await storage.getUserProfileByUserId(data.userId);
      if (existingProfile) {
        return res.status(400).json({ message: "Profile already exists for this User ID" });
      }

      const existingEmail = await storage.getUserProfileByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      if (data.password && !/^\d{6}$/.test(data.password)) {
         return res.status(400).json({ message: "Password must be exactly 6 digits (numbers only)" });
      }
      
      const passwordHash = await bcrypt.hash(data.password, 10);

      await storage.createUserProfile({
        userId: data.userId,
        name: data.name, // === Change: Passing new name field ===
        email: data.email,
        mobile: data.mobile,
        passwordHash,
        role: data.role || "user",
      });

      res.json({ message: "Registration successful" });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error.message || "Registration failed" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const profile = await storage.getUserProfileByEmail(email);

      if (!profile) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, profile.password_hash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        req.session.userId = profile.user_id;
        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Login failed" });
          }
          res.json({ message: "Login successful" });
        });
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUserWithProfile(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // ==================== USER MANAGEMENT ROUTES ====================
  app.get("/api/users", requireAuth, async (req, res) => {
    try {
      // Admin check: check for nested profile role
      const currentUserWithProfile = await storage.getUserWithProfile(req.session.userId!);
      if (currentUserWithProfile?.profile?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const users = await storage.getAllUsersWithProfiles();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.delete("/api/users/:id", requireAuth, async (req, res) => {
    try {
      // Admin check: check for nested profile role
      const currentUserWithProfile = await storage.getUserWithProfile(req.session.userId!);
      if (currentUserWithProfile?.profile?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ==================== ACCESS LOG ROUTES ====================
  app.get("/api/logs", requireAuth, async (req, res) => {
    try {
      const logs = await storage.getRecentAccessLogs(50);
      res.json(logs);
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ message: "Failed to get logs" });
    }
  });

  app.get("/api/logs/user/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const logs = await storage.getUserAccessLogs(userId);
      res.json(logs);
    } catch (error) {
      console.error("Get user logs error:", error);
      res.status(500).json({ message: "Failed to get user logs" });
    }
  });

  // ==================== SYSTEM STATS ====================
  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      stats.hardwareConnected = hardwareService.isConnected();
      res.json(stats);
    } catch (error) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });

  // ==================== HARDWARE (SIMULATION OPTIONAL) ====================
  app.post("/api/hardware/simulate", requireAuth, async (req, res) => {
    try {
      const { userId, result, note } = req.body;
      hardwareService.simulateAccessEvent(userId, result, note);
      res.json({ message: "Event simulated successfully" });
    } catch (error: any) {
      console.error("Simulate error:", error);
      res.status(500).json({ message: error.message || "Failed to simulate event" });
    }
  });

  // ==================== WEBSOCKET ====================
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Set<WebSocket>();
  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    clients.add(ws);

    ws.send(
      JSON.stringify({
        type: "hardware_status",
        connected: hardwareService.isConnected(),
      })
    );

    ws.on("close", () => {
      clients.delete(ws);
    });
    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    });
  });

  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  hardwareService.on("access_event", async (logData) => {
    try {
      await storage.createAccessLog(logData);
      const logWithUser = await storage.getRecentAccessLogs(1);
      broadcast({
        type: "access_log",
        log: logWithUser[0],
      });
    } catch (error) {
      console.error("Error processing access event:", error);
    }
  });

  hardwareService.on("registration", async (userData) => {
    try {
      await storage.createUser({
        id: userData.userId,
        fingerId: userData.fingerId,
        password: userData.password,
      });
      await storage.createAccessLog({
        userId: userData.userId,
        result: "REGISTERED",
        note: "New fingerprint registered",
      });
      broadcast({
        type: "hardware_status",
        connected: true,
      });
    } catch (error) {
      console.error("Error processing registration:", error);
    }
  });

  return httpServer;
}