// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import { loginSchema, insertUserProfileSchema, hardwareVerifySchema } from "@shared/schema";
import { z } from "zod";
import { hardwareService } from "./services/hardwareService";
/* NOTE: This file is the same as your original routes.ts with one
  new endpoint added:
    GET /api/stats
  which returns the system statistics (from storage.getSystemStats)
  plus the current hardware connection status:
    { totalUsers, totalAccessLogs, accessGrantedToday, accessDeniedToday, hardwareConnected 
*/
const registerSchema = insertUserProfileSchema.extend({
  password: z.string().min(6, "Password must be at least 2 characters"),
});
const updateUserProfileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  mobile: z.string().optional().nullable(),
  role: z.literal("admin").or(z.literal("user")),
});
const esp32EventSchema = z.object({
  command: z.literal("REG").or(z.literal("LOGIN")),
  userId: z.number().int().min(0),
  fingerId: z.number().int().min(0).optional(),
  password: z.string().optional(),
  result: z.literal("GRANTED").or(z.literal("DENIED")).or(z.literal("REGISTERED")).optional(),
  note: z.string().optional(),
});
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
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const user = await storage.getUser(data.userId);
      if (!user) {
        return res.status(400).json({ message: "User not found in hardware database. Please ensure fingerprint registration first." });
      }
      const existingProfile = await storage.getUserProfileByUserId(data.userId);
      if (existingProfile) {
        return res.status(400).json({ message: "Profile already exists for this User ID" });
      }
      if (!data.password || !/^\d{6}$/.test(data.password)) {
        return res.status(400).json({ message: "Password must be exactly 6 digits (numbers only)" });
      }
      const passwordHash = await bcrypt.hash(data.password, 10);
      await storage.createUserProfile({
        userId: data.userId,
        name: data.name,
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

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logout successful" });
    });
  });

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
  // ==================== STATS ENDPOINT (ADDED FIX) ====================
  // Returns system stats + current hardware connection flag
  // Frontend calls "/api/stats" frequently to show the stats cards and hardware status.
  app.get("/api/stats", async (_req, res) => {
    try {
      const stats = await storage.getSystemStats();
      const payload = {
        ...stats,
        hardwareConnected: hardwareService.isConnected(),
      };
      res.json(payload);
    } catch (error: any) {
      console.error("Get stats error:", error);
      res.status(500).json({ message: "Failed to get stats" });
    }
  });
  // ==================== NEW HARDWARE VERIFICATION ENDPOINT ====================
  app.post("/api/auth/verify_hardware", async (req, res) => {
    try {
      const { userId, password } = hardwareVerifySchema.parse(req.body);
      const profile = await storage.getUserProfileByUserId(userId);
      if (!profile) {
        return res.status(401).json({ message: "User ID not fully registered (No web profile found)." });
      }
      const valid = await bcrypt.compare(password, profile.password_hash);
      if (!valid) {
        return res.status(401).json({ message: "Password does not match database record." });
      }
      return res.json({ message: "Credentials verified." });
    } catch (error: any) {
      console.error("Hardware verification error:", error);
      res.status(400).json({ message: error.message || "Verification failed." });
    }
  });
  // ==================== USER MANAGEMENT ROUTES ====================
  app.put("/api/users/:id", requireAuth, async (req, res) => {
    try {
      const currentUserWithProfile = await storage.getUserWithProfile(req.session.userId!);
      if (currentUserWithProfile?.profile?.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format." });
      }
      const data = updateUserProfileSchema.parse(req.body);
      const profile = await storage.getUserProfileByUserId(userId);
      if (!profile) {
        return res.status(404).json({ message: "User profile not found." });
      }
      await storage.updateUserProfile(userId, {
        name: data.name,
        email: data.email,
        mobile: data.mobile || null,
        role: data.role,
      });
      const updatedUser = await storage.getUserWithProfile(userId);
      res.json(updatedUser);
    } catch (error: any) {
      console.error("Update user error:", error);
      res.status(400).json({ message: error.message || "Failed to update user" });
    }
  });

  app.get("/api/users", requireAuth, async (req, res) => {
    try {
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
  // ==================== HARDWARE API ENDPOINT (LOGGING ONLY) ====================
  app.post("/api/hardware/event", async (req, res) => {
    try {
      const data = esp32EventSchema.parse(req.body);
      
      // Check if the user ID exists in the 'users' table (hardware registration)
      const existingUser = await storage.getUser(data.userId);

      // Registration
      if (data.command === "REG" && data.result === "REGISTERED") {
        const { userId, fingerId } = data;
        if (existingUser) {
          return res.status(409).json({ message: "User ID already exists." });
        }
        await storage.createUser({
          id: userId,
          fingerId: fingerId!,
          password: "HARDWARE_DEFAULT_PIN",
        });
        hardwareService.processAccessEvent(userId, data.result, data.note || "New fingerprint registered via Wi-Fi.");
        return res.json({ message: "Registration successful" });
      }
      
      // Login / Access event
      if (data.command === "LOGIN") {
        // ✅ CRITICAL FIX: Prevent Foreign Key Constraint Error
        if (!existingUser) {
          console.error(`Hardware LOGIN attempt for unknown userId: ${data.userId}`);
          return res.status(404).json({ message: `User ID ${data.userId} not found in hardware database.` });
        }
        
        // ✅ FIX FOR SYNTAX ERROR: Concatenated string on a single line
        hardwareService.processAccessEvent(
          data.userId,
          (data.result as "GRANTED" | "DENIED") || "DENIED",
          data.note || `Hardware check failed/succeeded. Result: ${data.result}` 
        );
        return res.json({ message: "Access logged successfully" });
      }
      
      return res.status(400).json({ message: "Invalid hardware command." });
    } catch (error: any) {
      console.error("Hardware event processing error:", error);
      // Ensure error handling returns a response
      if (!res.headersSent) {
          res.status(400).json({ message: error.message || "Failed to process hardware event" });
      }
    }
  });

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
  // ==================== WEBSOCKET SETUP ====================
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
  hardwareService.on("hardware_status_change", (connected: boolean) => {
    broadcast({ type: "hardware_status", connected: connected });
  });

  // ✅ FIX: Fetch the complete log object *after* insertion to ensure it includes the user's profile/name for the frontend.
  hardwareService.on("access_event", async (logData) => {
    try {
      await storage.createAccessLog(logData);
      // Fetch the MOST recent log with profile data
      const logWithUser = await storage.getRecentAccessLogs(1);
      if (logWithUser && logWithUser.length > 0) {
        broadcast({ type: "access_log", log: logWithUser[0] });
      }
    } catch (error) {
      console.error("Error processing access event:", error);
    }
  });

  return httpServer;
}