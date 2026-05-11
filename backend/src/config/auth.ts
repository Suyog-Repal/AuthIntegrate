const isDev = process.env.NODE_ENV !== "production";

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (isDev) {
    // In development, warn loudly but allow continuation so local dev still works
    console.warn(
      "⚠️  [AUTH CONFIG] JWT_SECRET is not set. " +
      "Using an insecure fallback only for local development. " +
      "This MUST be set before deploying to production."
    );
  } else {
    // In production, refuse to start with a missing secret
    console.error("❌ [FATAL] JWT_SECRET environment variable is required in production. Exiting.");
    process.exit(1);
  }
}

export const authConfig = {
  jwtSecret: (jwtSecret || "dev-only-insecure-fallback-do-not-use-in-production") as string,
  jwtExpiresIn: "2h",
  saltRounds: 10,
};
