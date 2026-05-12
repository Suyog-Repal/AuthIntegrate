import "dotenv/config";
import { emailService } from "./src/services/email.service.js";

async function run() {
  console.log("🚀 Testing Resend email service...");
  
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ Error: RESEND_API_KEY is not defined in .env");
    return;
  }

  // Use EMAIL_USER if it still exists in .env for convenience, otherwise use a placeholder
  const testRecipient = process.env.EMAIL_USER || "onboarding@resend.dev";
  
  console.log(`[TEST] Sending password reset email to: ${testRecipient}`);
  
  const success = await emailService.sendPasswordResetEmail({
    email: testRecipient,
    name: "Test User",
    resetLink: "http://localhost:5173/reset-password?token=test",
    expiryMinutes: 15
  });
  
  if (success) {
    console.log("✅ Email sent successfully via Resend. Check the inbox (or Resend dashboard)!");
  } else {
    console.log("❌ Failed to send email via Resend.");
  }
}

run().catch(console.error);
