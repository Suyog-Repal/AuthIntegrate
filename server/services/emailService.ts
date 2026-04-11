// 🔥 PHASE 7: Email notification service for registration confirmations
import nodemailer from 'nodemailer';

interface EmailOptions {
  email: string;
  name: string;
  userId: number;
}

// Configure email transporter (supports Gmail and any SMTP provider)
function getEmailTransporter() {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn('⚠️  EMAIL_USER or EMAIL_PASS not set in environment variables. Email notifications disabled.');
    return null;
  }

  // For Gmail, enable "Less secure app access" or use App Password with 2FA
  // For other SMTP providers, adjust the transporter configuration
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
}

export async function sendRegistrationEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    
    if (!transporter) {
      console.log('📧 Email service not configured. Skipping email notification.');
      return false;
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: options.email,
      subject: 'Registration Successful - AuthIntegrate System 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">AuthIntegrate System</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Dual-Factor Authentication</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0;">Welcome, ${options.name}! 👋</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              Congratulations! Your account has been successfully registered in the AuthIntegrate system.
            </p>

            <div style="background: #f0f4ff; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Account Details:</strong></p>
              <p style="margin: 5px 0; color: #666;"><strong>Name:</strong> ${options.name}</p>
              <p style="margin: 5px 0; color: #666;"><strong>User ID:</strong> ${options.userId}</p>
              <p style="margin: 5px 0; color: #666;"><strong>Email:</strong> ${options.email}</p>
            </div>

            <h3 style="color: #333; margin-top: 25px;">How to Login:</h3>
            <ol style="color: #666; line-height: 1.8;">
              <li>Use your fingerprint on the ESP32 hardware device</li>
              <li>Enter your 6-digit PIN on the web dashboard</li>
              <li>You'll be authenticated via dual-factor verification</li>
            </ol>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️  Security Reminder:</strong> Never share your User ID or PIN with anyone. Keep your credentials safe!
              </p>
            </div>

            <p style="color: #666; margin-top: 25px; font-size: 14px;">
              If you didn't register this account or have any questions, please contact our support team immediately.
            </p>

            <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;">

            <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
              © 2024 AuthIntegrate - Secure Authentication System<br>
              This is an automated message. Please do not reply to this email.
            </p>
          </div>
        </div>
      `,
      text: `
Welcome, ${options.name}!

Congratulations! Your account has been successfully registered in the AuthIntegrate system.

Account Details:
- Name: ${options.name}
- User ID: ${options.userId}
- Email: ${options.email}

How to Login:
1. Use your fingerprint on the ESP32 hardware device
2. Enter your 6-digit PIN on the web dashboard
3. You'll be authenticated via dual-factor verification

Security Reminder: Never share your User ID or PIN with anyone. Keep your credentials safe!

If you didn't register this account or have any questions, please contact our support team immediately.

© 2024 AuthIntegrate - Secure Authentication System
      `,
    };

    // Send email asynchronously without blocking the API response
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Error sending registration email:', error.message);
      } else {
        console.log('✅ Registration email sent successfully:', info.response);
      }
    });

    return true;
  } catch (error: any) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
}
