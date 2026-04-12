// server/routes.ts
import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import session from "express-session";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { storage } from "./storage";
import { requireAuth } from "./middleware/auth";
import { loginSchema, insertUserProfileSchema, hardwareVerifySchema } from "@shared/schema";
import { z } from "zod";
import { hardwareService } from "./services/hardwareService";
import { sendRegistrationEmail, sendPasswordResetEmail } from "./services/emailService";
import { exportLogsToExcel, exportLogsToPDF } from "./services/exportService";
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

// ==================== PASSWORD RESET SCHEMAS ====================
const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().regex(/^\d{6}$/, "Password must be exactly 6 digits (numbers only)"),
  confirmPassword: z.string().regex(/^\d{6}$/, "Password confirmation must be exactly 6 digits (numbers only)"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
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
        secure: false,
        httpOnly: true,
        sameSite: "lax",
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

      // 🔥 PHASE 7: Send registration confirmation email asynchronously
      await sendRegistrationEmail({
        email: data.email,
        name: data.name,
        userId: data.userId,
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

  // ==================== PASSWORD RESET ENDPOINTS ====================
  // POST /api/auth/forgot-password
  // Request: { email: string }
  // Response: { message: string }
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      // Check if user exists
      const profile = await storage.getUserProfileByEmail(email);
      if (!profile) {
        // Don't expose that email doesn't exist for security
        return res.json({ message: "If an account exists with that email, a password reset link will be sent" });
      }

      // Generate secure random token
      const resetToken = randomBytes(32).toString("hex");
      
      // Save token with 15 minute expiry
      await storage.saveResetToken(profile.user_id, resetToken, 15);
      
      console.log(`✅ Password reset token generated and saved for user ${profile.user_id} (${email})`);
      console.log(`   Token: ${resetToken.substring(0, 16)}... (first 16 chars)`);

      // Construct reset link using FRONTEND_URL (not backend API URL)
      // CRITICAL: This should point to frontend, not localhost:5000
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      
      // Validate FRONTEND_URL configuration
      if (!process.env.FRONTEND_URL) {
        console.warn(
          "⚠️  FRONTEND_URL environment variable is missing! Using fallback: http://localhost:5173\n" +
          "    For production, add FRONTEND_URL to your .env file (e.g., FRONTEND_URL=https://authintegrate.ddnsgeek.com)"
        );
      }
      
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
      console.log(`   Reset link: ${resetLink}`);

      // Send reset email
      await sendPasswordResetEmail({
        email: profile.email,
        name: profile.name,
        resetLink,
        expiryMinutes: 15,
      });

      res.json({ message: "If an account exists with that email, a password reset link will be sent" });
    } catch (error: any) {
      console.error("Forgot password error:", error);
      res.status(400).json({ message: error.message || "Failed to process password reset request" });
    }
  });

  // POST /api/auth/reset-password
  // Request: { token: string, newPassword: string, confirmPassword: string }
  // Response: { message: string }
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      
      console.log(`🔍 Attempting to reset password with token: ${token.substring(0, 16)}... (first 16 chars)`);

      // Verify token and get user
      const profile = await storage.getUserByResetToken(token);
      
      if (!profile) {
        console.error(`❌ Reset token validation failed for token: ${token.substring(0, 16)}...`);
        console.error(`   Token may be invalid, expired, or mismatched in database`);
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      console.log(`✅ Token validated successfully for user: ${profile.user_id}`);

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password and clear reset token
      await storage.updatePassword(profile.user_id, passwordHash);
      await storage.clearResetToken(profile.user_id);
      
      console.log(`✅ Password reset complete for user: ${profile.user_id}`);

      res.json({ message: "Password reset successful" });
    } catch (error: any) {
      console.error("Reset password error:", error);
      res.status(400).json({ message: error.message || "Failed to reset password" });
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

  // 🚀 STEP 2 — Backend: Fetch previous logs with optional filters
  app.get("/api/logs", async (req, res) => {
    try {
      // Extract and validate query parameters
      const filters = {
        date: req.query.date as string | undefined,
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        status: req.query.status as 'GRANTED' | 'DENIED' | 'REGISTERED' | undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        startTime: req.query.startTime as string | undefined,
        endTime: req.query.endTime as string | undefined,
        searchTerm: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => filters[key as keyof typeof filters] === undefined && delete filters[key as keyof typeof filters]);

      const logs = await storage.getAccessLogsWithFilters(filters);
      res.json(logs);
    } catch (error: any) {
      console.error("Get logs error:", error);
      res.status(500).json({ message: "Failed to get logs" });
    }
  });

  // ==================== USER LOGS ENDPOINT ====================
  // GET /api/logs/user - Get logs for the authenticated user
  app.get("/api/logs/user", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const logs = await storage.getUserAccessLogs(userId);
      res.json(logs);
    } catch (error: any) {
      console.error("Get user logs error:", error);
      res.status(500).json({ message: "Failed to get user logs" });
    }
  });

  // 🔥 PHASE 6: Export logs to Excel
  app.get("/api/logs/export/excel", async (req, res) => {
    try {
      // Get filters from query parameters (same as /api/logs)
      const filters: any = {};
      if (req.query.date) filters.date = req.query.date as string;
      if (req.query.month) filters.month = parseInt(req.query.month as string);
      if (req.query.year) filters.year = parseInt(req.query.year as string);
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.userId) filters.userId = parseInt(req.query.userId as string);
      if (req.query.search) filters.searchTerm = req.query.search as string;
      filters.limit = 10000; // Allow exporting up to 10,000 records

      console.log('📥 Excel export filters:', filters);
      const logs = await storage.getAccessLogsWithFilters(filters);
      console.log(`📊 Exporting ${logs.length} logs to Excel`);
      
      const buffer = await exportLogsToExcel(logs);
      console.log(`✅ Excel buffer created: ${buffer.length} bytes`);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.xlsx"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (error: any) {
      console.error("❌ Excel export error:", error.message, error);
      res.status(500).json({ message: `Export failed: ${error.message}` });
    }
  });

  // 🔥 PHASE 6: Export logs to PDF
  app.get("/api/logs/export/pdf", async (req, res) => {
    try {
      // Get filters from query parameters (same as /api/logs)
      const filters: any = {};
      if (req.query.date) filters.date = req.query.date as string;
      if (req.query.month) filters.month = parseInt(req.query.month as string);
      if (req.query.year) filters.year = parseInt(req.query.year as string);
      if (req.query.status) filters.status = req.query.status as string;
      if (req.query.userId) filters.userId = parseInt(req.query.userId as string);
      if (req.query.search) filters.searchTerm = req.query.search as string;
      filters.limit = 10000; // Allow exporting up to 10,000 records

      console.log('📥 PDF export filters:', filters);
      const logs = await storage.getAccessLogsWithFilters(filters);
      console.log(`📊 Exporting ${logs.length} logs to PDF`);
      
      const buffer = await exportLogsToPDF(logs);
      console.log(`✅ PDF buffer created: ${buffer.length} bytes`);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="logs_${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.end(buffer);
    } catch (error: any) {
      console.error("❌ PDF export error:", error.message, error);
      res.status(500).json({ message: `Export failed: ${error.message}` });
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
  // ==================== SOCKET.IO SETUP ====================
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket.io client connected:", socket.id);
  });

  hardwareService.on("hardware_status_change", (connected: boolean) => {
    io.emit("hardware_status", { connected: connected });
  });

  // ✅ FIX: Fetch the complete log object *after* insertion to ensure it includes the user's profile/name for the frontend.
  hardwareService.on("access_event", async (logData) => {
    try {
      await storage.createAccessLog(logData);
      // Fetch the MOST recent log with profile data
      const logWithUser = await storage.getRecentAccessLogs(1);
      if (logWithUser && logWithUser.length > 0) {
        // 🔥 REAL-TIME EMIT
        io.emit("new-log", logWithUser[0]);
      }
    } catch (error) {
      console.error("Error processing access event:", error);
    }
  });

  return httpServer;
}