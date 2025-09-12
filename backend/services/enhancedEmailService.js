const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EnhancedEmailService {
  constructor() {
    // Configure email transporter
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Enhanced email service configuration error:', error);
        } else {
          console.log('✅ Enhanced email service ready');
        }
      });
    } else {
      console.log('⚠️ Enhanced email service disabled - no credentials provided');
      this.transporter = null;
    }

    // Email templates directory
    this.templatesDir = path.join(__dirname, '../templates/emails');
    this.ensureTemplatesDirectory();
  }

  async ensureTemplatesDirectory() {
    try {
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      console.error('Error creating templates directory:', error);
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user) {
    return this.sendEmail({
      to: user.email,
      subject: 'Welcome to AfroAsiaConnect! 🎉',
      template: 'welcome',
      data: { user }
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    return this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request - AfroAsiaConnect',
      template: 'password-reset',
      data: { user, resetUrl, resetToken }
    });
  }

  // Send email verification
  async sendEmailVerification(user, verificationToken) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;
    return this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email - AfroAsiaConnect',
      template: 'email-verification',
      data: { user, verificationUrl, verificationToken }
    });
  }

  // Send payment confirmation email
  async sendPaymentConfirmationEmail(payment, booking) {
    return this.sendEmail({
      to: payment.customerEmail,
      subject: `Payment Confirmation - ${booking.service.serviceName}`,
      template: 'payment-confirmation',
      data: { payment, booking }
    });
  }

  // Send review request email
  async sendReviewRequestEmail(booking) {
    return this.sendEmail({
      to: booking.customerEmail,
      subject: 'Share Your Experience - Leave a Review',
      template: 'review-request',
      data: { booking }
    });
  }

  // Send newsletter email
  async sendNewsletterEmail(user, newsletter) {
    return this.sendEmail({
      to: user.email,
      subject: newsletter.subject,
      template: 'newsletter',
      data: { user, newsletter }
    });
  }

  // Send promotional email
  async sendPromotionalEmail(user, promotion) {
    return this.sendEmail({
      to: user.email,
      subject: promotion.subject,
      template: 'promotional',
      data: { user, promotion }
    });
  }

  // Send service approval notification
  async sendServiceApprovalEmail(provider, service, approved = true) {
    const subject = approved ? 'Service Approved! 🎉' : 'Service Requires Changes';
    return this.sendEmail({
      to: provider.email,
      subject,
      template: 'service-approval',
      data: { provider, service, approved }
    });
  }

  // Send account suspension notification
  async sendAccountSuspensionEmail(user, reason, duration) {
    return this.sendEmail({
      to: user.email,
      subject: 'Important: Account Suspension Notice',
      template: 'account-suspension',
      data: { user, reason, duration }
    });
  }

  // Send bulk email to multiple recipients
  async sendBulkEmail(recipients, subject, template, data) {
    if (!this.transporter) {
      console.log('⚠️ Email service disabled - skipping bulk email');
      return { success: false, reason: 'Email service not configured' };
    }

    const results = [];
    const batchSize = 50; // Send in batches to avoid rate limits

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchPromises = batch.map(recipient => 
        this.sendEmail({
          to: recipient.email,
          subject,
          template,
          data: { ...data, user: recipient }
        })
      );

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Add delay between batches
        if (i + batchSize < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error('Error in bulk email batch:', error);
      }
    }

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return {
      success: true,
      total: recipients.length,
      successful,
      failed,
      results
    };
  }

  // Core email sending method
  async sendEmail({ to, subject, template, data, attachments = [] }) {
    if (!this.transporter) {
      console.log('⚠️ Email service disabled - skipping email');
      return { success: false, reason: 'Email service not configured' };
    }

    try {
      const emailContent = await this.generateEmailContent(template, data);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'AfroAsiaConnect <noreply@afroasiaconnect.com>',
        to,
        subject,
        html: emailContent.html,
        text: emailContent.text,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Email sent:', {
        to,
        subject,
        template,
        messageId: result.messageId
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate email content from templates
  async generateEmailContent(template, data) {
    try {
      // Try to load custom template first
      const templatePath = path.join(this.templatesDir, `${template}.js`);
      try {
        const templateModule = require(templatePath);
        return templateModule.generate(data);
      } catch (error) {
        // Fall back to built-in templates
        return this.getBuiltInTemplate(template, data);
      }
    } catch (error) {
      console.error('Error generating email content:', error);
      return this.getDefaultTemplate(data);
    }
  }

  // Built-in email templates
  getBuiltInTemplate(template, data) {
    const templates = {
      'welcome': this.generateWelcomeTemplate(data),
      'password-reset': this.generatePasswordResetTemplate(data),
      'email-verification': this.generateEmailVerificationTemplate(data),
      'payment-confirmation': this.generatePaymentConfirmationTemplate(data),
      'review-request': this.generateReviewRequestTemplate(data),
      'newsletter': this.generateNewsletterTemplate(data),
      'promotional': this.generatePromotionalTemplate(data),
      'service-approval': this.generateServiceApprovalTemplate(data),
      'account-suspension': this.generateAccountSuspensionTemplate(data)
    };

    return templates[template] || this.getDefaultTemplate(data);
  }

  generateWelcomeTemplate(data) {
    const { user } = data;
    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1>🎉 Welcome to AfroAsiaConnect!</h1>
            <p>Connecting Africa and Asia through exceptional services</p>
          </div>
          <div style="padding: 30px; background: #f9fafb;">
            <p>Dear ${user.firstName || 'Valued Member'},</p>
            <p>Welcome to AfroAsiaConnect! We're thrilled to have you join our growing community.</p>
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
              <h3>🔍 Discover Services</h3>
              <p>Browse professional services from verified providers across Africa and Asia.</p>
            </div>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Get Started</a>
            </div>
          </div>
        </div>
      `,
      text: `Welcome to AfroAsiaConnect! Dear ${user.firstName || 'Valued Member'}, we're thrilled to have you join our community. Get started: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`
    };
  }

  generatePasswordResetTemplate(data) {
    const { user, resetUrl } = data;
    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
            <p>Hello ${user.firstName || 'User'},</p>
            <p>We received a request to reset your password.</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
            </div>
            <p><small>This link expires in 1 hour. If you didn't request this, please ignore this email.</small></p>
          </div>
        </div>
      `,
      text: `Password Reset Request. Hello ${user.firstName || 'User'}, reset your password: ${resetUrl}`
    };
  }

  generateEmailVerificationTemplate(data) {
    const { user, verificationUrl } = data;
    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #059669; color: white; padding: 20px; text-align: center;">
            <h1>📧 Verify Your Email</h1>
          </div>
          <div style="padding: 20px; background: #f9fafb;">
            <p>Hello ${user.firstName || 'User'},</p>
            <p>Please verify your email address to complete your registration.</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${verificationUrl}" style="background: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Verify Email</a>
            </div>
          </div>
        </div>
      `,
      text: `Verify Your Email. Hello ${user.firstName || 'User'}, verify your email: ${verificationUrl}`
    };
  }

  getDefaultTemplate(data) {
    return {
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>AfroAsiaConnect Notification</h2>
          <p>You have received a notification from AfroAsiaConnect.</p>
          <p>Best regards,<br>The AfroAsiaConnect Team</p>
        </div>
      `,
      text: 'You have received a notification from AfroAsiaConnect.'
    };
  }
}

module.exports = new EnhancedEmailService();
