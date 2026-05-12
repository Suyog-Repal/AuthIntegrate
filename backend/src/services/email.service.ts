import { Resend } from 'resend';

interface EmailOptions {
  email: string;
  name: string;
  userId: number;
}

interface PasswordResetEmailOptions {
  email: string;
  name: string;
  resetLink: string;
  expiryMinutes?: number;
}

export class EmailService {
  private resend: Resend | null = null;

  constructor() {
    this.initializeResend();
  }

  private initializeResend() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('❌ CRITICAL ERROR: RESEND_API_KEY is not set in environment variables.');
      console.warn('⚠️ Email notifications will fail until RESEND_API_KEY is provided.');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      console.log('✅ Resend API initialized successfully.');
    } catch (error) {
      console.error('❌ Failed to initialize Resend API:', error);
    }
  }

  private getResendClient() {
    if (!this.resend) {
      // Try to re-initialize in case the key was added later (though unlikely in current process model)
      this.initializeResend();
    }
    return this.resend;
  }

  async sendRegistrationEmail(options: EmailOptions): Promise<boolean> {
    const resend = this.getResendClient();
    if (!resend) {
      console.error('❌ EMAIL FAILURE: Resend client not initialized. Cannot send registration email.');
      return false;
    }

    const emailTemplate = `
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
          <p style="color: #999; font-size: 12px; margin: 0; text-align: center;">
            © 2026 AuthIntegrate - Secure Authentication System
          </p>
        </div>
      </div>
    `;

    try {
      if (process.env.NODE_ENV !== 'production') console.log(`[RESEND] Attempting to send registration email to: ${options.email}`);
      
      const { data, error } = await resend.emails.send({
        from: 'AuthIntegrate <onboarding@resend.dev>',
        to: options.email,
        subject: 'Registration Successful - AuthIntegrate System 🎉',
        html: emailTemplate,
      });

      if (error) {
        console.error(`❌ RESEND API ERROR: Failed to send registration email to ${options.email}`);
        console.error(`[ERROR DETAILS]:`, error);
        return false;
      }

      console.log(`✅ Registration email sent successfully to ${options.email}. Id: ${data?.id}`);
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ RESEND UNEXPECTED FAILURE: Failed to send registration email to ${options.email}`);
      console.error(`[ERROR DETAILS]: ${msg}`);
      return false;
    }
  }

  async sendPasswordResetEmail(options: PasswordResetEmailOptions): Promise<boolean> {
    const resend = this.getResendClient();
    if (!resend) {
      console.error('❌ EMAIL FAILURE: Resend client not initialized. Cannot send password reset email.');
      return false;
    }

    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">AuthIntegrate System</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Password Recovery</p>
        </div>
        <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Password Reset Request 🔐</h2>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">Hello ${options.name},</p>
          <p style="color: #666; line-height: 1.6;">Click the button below to proceed with creating a new password.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${options.resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 5px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; line-height: 1.6; font-size: 14px;">
            <strong>⏱️ Expiration:</strong> This link will expire in ${options.expiryMinutes || 15} minutes.
          </p>
        </div>
      </div>
    `;

    try {
      if (process.env.NODE_ENV !== 'production') console.log(`[RESEND] Attempting to send password reset email to: ${options.email}`);
      
      const { data, error } = await resend.emails.send({
        from: 'AuthIntegrate <onboarding@resend.dev>',
        to: options.email,
        subject: 'Reset Your Password - AuthIntegrate System 🔐',
        html: emailTemplate,
      });

      if (error) {
        console.error(`❌ RESEND API ERROR: Failed to send password reset email to ${options.email}`);
        console.error(`[ERROR DETAILS]:`, error);
        return false;
      }

      console.log(`✅ Password reset email sent successfully to ${options.email}. Id: ${data?.id}`);
      return true;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error(`❌ RESEND UNEXPECTED FAILURE: Failed to send password reset email to ${options.email}`);
      console.error(`[ERROR DETAILS]: ${msg}`);
      return false;
    }
  }
}

export const emailService = new EmailService();
