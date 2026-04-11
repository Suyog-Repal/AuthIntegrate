// server/index.ts
import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";

dotenv.config();

const app = express();

// INCREASED BODY SIZE LIMIT: Helps ensure JSON payloads from ESP32 are accepted.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });
  next();
});

(async () => {
  const httpServer = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // For hardware POST requests, send a clean error
    if (_req.path === '/api/hardware/event' && status === 400) {
        log(`Hardware POST error: ${message}`);
        return res.status(400).json({ message: message });
    }

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite in development
  if (app.get("env") === "development") {
    await setupVite(app, httpServer);
  } else {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const publicPath = path.join(__dirname, "public");

    log(`📁 Serving static files from: ${publicPath}`);
    log(`📁 Full static path: ${publicPath}`);

    // ✅ CRITICAL: Serve static files with proper caching
    app.use(express.static(publicPath, {
      maxAge: "1d",
      etag: false,
      // ✅ Serve .js and .css with proper content types
      setHeaders: (res, path, stat) => {
        if (path.endsWith(".js")) {
          res.setHeader("Content-Type", "application/javascript");
        } else if (path.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css");
        }
        // Don't cache HTML files - let browser check for updates
        if (path.endsWith(".html")) {
          res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
        }
      },
    }));

    // ✅ CRITICAL: Catch-all SPA route ONLY for non-API routes
    // This MUST come AFTER express.static() and AFTER registerRoutes()
    app.get("*", (_req, res) => {
      // Don't serve HTML for API routes (safety check)
      if (_req.path.startsWith("/api")) {
        return res.status(404).json({ message: "API route not found" });
      }

      const indexPath = path.join(publicPath, "index.html");
      res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
      res.sendFile(indexPath, (err) => {
        if (err) {
          log(`⚠️  Could not send index.html from ${indexPath}`);
          log(`⚠️  Error details: ${err.message}`);
          res.status(500).json({ message: "Client build files not found. Please run npm run build." });
        }
      });
    });
  }

  const basePort = parseInt(process.env.PORT || "5000", 10);
  let currentPort = basePort;
  let attempts = 0;
  const maxAttempts = 5;

  /**
   * Attempts to start the server with exponential backoff retry
   */
  function startServer(port: number): void {
    log(`🔄 Attempting to start server on port ${port}...`);
    
    // CRITICAL: Attach error handler BEFORE listening to avoid race conditions
    httpServer.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        attempts++;
        if (attempts >= maxAttempts) {
          log(`❌ Failed to start server after ${maxAttempts} attempts. Port ${port} is permanently in use.`);
          log(`💡 Kill lingering processes: killall node 2>/dev/null || taskkill /F /IM node.exe`);
          process.exit(1);
        }

        log(`⚠️  Port ${port} is in use (attempt ${attempts}/${maxAttempts}). Trying port ${port + 1}...`);
        
        // Close existing listeners and retry on next port
        currentPort++;
        httpServer.removeAllListeners("error");
        setTimeout(() => {
          startServer(currentPort);
        }, 500 + (100 * attempts)); // Exponential backoff
      } else {
        log(`❌ Server error: ${err.message}`);
        process.exit(1);
      }
    });

    // NOW call listen after error handler is attached
    httpServer.listen(port, "0.0.0.0", () => {
      log(`✅ Server running and accessible via network at ${process.env.DB_HOST}:${port} or 0.0.0.0:${port}`);
    });
  }

  // Start the server
  startServer(currentPort);

  // Graceful shutdown
  process.on("SIGINT", () => {
    log("🛑 Shutting down gracefully...");
    httpServer.close(() => {
      log("✅ Server shut down successfully");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      log("❌ Forced shutdown (timeout)");
      process.exit(1);
    }, 10000);
  });
})();