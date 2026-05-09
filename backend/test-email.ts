import "dotenv/config";
import { emailService } from "./src/services/email.service";

async function run() {
  console.log("Testing email service...");
  console.log("EMAIL_USER:", process.env.EMAIL_USER);
  const success = await emailService.sendPasswordResetEmail({
    email: process.env.EMAIL_USER!, // send to self
    name: "Test User",
    resetLink: "http://localhost:5173/reset-password?token=test",
  });
  
  if (success) {
    console.log("✅ Email sent successfully. Check the inbox!");
  } else {
    console.log("❌ Failed to send email.");
  }
}

run();
