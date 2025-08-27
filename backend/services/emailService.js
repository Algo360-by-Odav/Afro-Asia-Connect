const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // Only configure email transporter if credentials are provided
    if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD
        }
      });

      // Verify transporter configuration
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('❌ Email service configuration error:', error);
        } else {
          console.log('✅ Email service ready to send messages');
        }
      });
    } else {
      console.log('⚠️ Email service disabled - no credentials provided');
      this.transporter = null;
    }
  }

  // Send booking confirmation email to customer
  async sendBookingConfirmation(booking) {
    if (!this.transporter) {
      console.log('⚠️ Email service disabled - skipping booking confirmation email');
      return { success: false, reason: 'Email service not configured' };
    }

    try {
      const emailContent = this.generateBookingConfirmationEmail(booking);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'AfroAsiaConnect <noreply@afroasiaconnect.com>',
        to: booking.customerEmail,
        subject: `Booking Confirmation - ${booking.service.serviceName}`,
        html: emailContent.html,
        text: emailContent.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Booking confirmation sent:', {
        bookingId: booking.id,
        customer: booking.customerEmail,
        messageId: result.messageId
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending booking confirmation:', error);
      return { success: false, error: error.message };
    }
  }

  // Send booking notification to service provider
  async sendProviderNotification(booking) {
    if (!this.transporter) {
      console.log('⚠️ Email service disabled - skipping provider notification email');
      return { success: false, reason: 'Email service not configured' };
    }

    try {
      const emailContent = this.generateProviderNotificationEmail(booking);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'AfroAsiaConnect <noreply@afroasiaconnect.com>',
        to: booking.provider.email,
        subject: `New Booking Received - ${booking.service.serviceName}`,
        html: emailContent.html,
        text: emailContent.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Provider notification sent:', {
        bookingId: booking.id,
        provider: booking.provider.email,
        messageId: result.messageId
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending provider notification:', error);
      return { success: false, error: error.message };
    }
  }

  // Send booking reminder email
  async sendBookingReminder(booking, reminderType = '24h') {
    if (!this.transporter) {
      console.log('⚠️ Email service disabled - skipping booking reminder email');
      return { success: false, reason: 'Email service not configured' };
    }

    try {
      const emailContent = this.generateBookingReminderEmail(booking, reminderType);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'AfroAsiaConnect <noreply@afroasiaconnect.com>',
        to: booking.customerEmail,
        subject: `Booking Reminder - ${booking.service.serviceName}`,
        html: emailContent.html,
        text: emailContent.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Booking reminder sent:', {
        bookingId: booking.id,
        customer: booking.customerEmail,
        reminderType,
        messageId: result.messageId
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending booking reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Send booking status update email
  async sendBookingStatusUpdate(booking, oldStatus) {
    if (!this.transporter) {
      console.log('⚠️ Email service disabled - skipping booking status update email');
      return { success: false, reason: 'Email service not configured' };
    }

    try {
      const emailContent = this.generateStatusUpdateEmail(booking, oldStatus);
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'AfroAsiaConnect <noreply@afroasiaconnect.com>',
        to: booking.customerEmail,
        subject: `Booking Update - ${booking.service.serviceName}`,
        html: emailContent.html,
        text: emailContent.text
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('📧 Status update sent:', {
        bookingId: booking.id,
        customer: booking.customerEmail,
        status: booking.status,
        messageId: result.messageId
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending booking status update:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate booking confirmation email content
  generateBookingConfirmationEmail(booking) {
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString();
    const bookingTime = booking.bookingTime;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
            <p>Thank you for choosing AfroAsiaConnect</p>
          </div>
          
          <div class="content">
            <p>Dear ${booking.customerName},</p>
            <p>Your booking has been confirmed! Here are the details:</p>
            
            <div class="booking-details">
              <h3>📋 Booking Details</h3>
              <div class="detail-row">
                <span class="label">Booking ID:</span>
                <span>#${booking.id}</span>
              </div>
              <div class="detail-row">
                <span class="label">Service:</span>
                <span>${booking.service.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Provider:</span>
                <span>${booking.provider.firstName} ${booking.provider.lastName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span>${bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span>${booking.duration} minutes</span>
              </div>
              <div class="detail-row">
                <span class="label">Total Amount:</span>
                <span>$${booking.totalAmount}</span>
              </div>
              ${booking.specialRequests ? `
              <div class="detail-row">
                <span class="label">Special Requests:</span>
                <span>${booking.specialRequests}</span>
              </div>
              ` : ''}
            </div>
            
            <p>📧 You will receive a reminder email 24 hours before your appointment.</p>
            <p>📞 If you need to make any changes, please contact us or the service provider directly.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/bookings" class="button">
                View My Bookings
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The AfroAsiaConnect Team</p>
            <p><small>This is an automated message. Please do not reply to this email.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Booking Confirmation - AfroAsiaConnect
      
      Dear ${booking.customerName},
      
      Your booking has been confirmed!
      
      Booking Details:
      - Booking ID: #${booking.id}
      - Service: ${booking.service.serviceName}
      - Provider: ${booking.provider.firstName} ${booking.provider.lastName}
      - Date: ${bookingDate}
      - Time: ${bookingTime}
      - Duration: ${booking.duration} minutes
      - Total Amount: $${booking.totalAmount}
      ${booking.specialRequests ? `- Special Requests: ${booking.specialRequests}` : ''}
      
      You will receive a reminder email 24 hours before your appointment.
      
      View your bookings: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/bookings
      
      Best regards,
      The AfroAsiaConnect Team
    `;

    return { html, text };
  }

  // Generate provider notification email content
  generateProviderNotificationEmail(booking) {
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString();
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Booking Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💼 New Booking Received!</h1>
            <p>You have a new service booking</p>
          </div>
          
          <div class="content">
            <p>Hello ${booking.provider.firstName},</p>
            <p>You have received a new booking for your service:</p>
            
            <div class="booking-details">
              <h3>📋 Booking Details</h3>
              <div class="detail-row">
                <span class="label">Booking ID:</span>
                <span>#${booking.id}</span>
              </div>
              <div class="detail-row">
                <span class="label">Service:</span>
                <span>${booking.service.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Customer:</span>
                <span>${booking.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span>${booking.customerEmail}</span>
              </div>
              ${booking.customerPhone ? `
              <div class="detail-row">
                <span class="label">Phone:</span>
                <span>${booking.customerPhone}</span>
              </div>
              ` : ''}
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span>${booking.bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span>${booking.duration} minutes</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount:</span>
                <span>$${booking.totalAmount}</span>
              </div>
              ${booking.specialRequests ? `
              <div class="detail-row">
                <span class="label">Special Requests:</span>
                <span>${booking.specialRequests}</span>
              </div>
              ` : ''}
            </div>
            
            <p>📅 Please confirm this booking and prepare for the appointment.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/bookings" class="button">
                Manage Bookings
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The AfroAsiaConnect Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      New Booking Received - AfroAsiaConnect
      
      Hello ${booking.provider.firstName},
      
      You have received a new booking for your service:
      
      Booking Details:
      - Booking ID: #${booking.id}
      - Service: ${booking.service.serviceName}
      - Customer: ${booking.customerName}
      - Email: ${booking.customerEmail}
      ${booking.customerPhone ? `- Phone: ${booking.customerPhone}` : ''}
      - Date: ${bookingDate}
      - Time: ${booking.bookingTime}
      - Duration: ${booking.duration} minutes
      - Amount: $${booking.totalAmount}
      ${booking.specialRequests ? `- Special Requests: ${booking.specialRequests}` : ''}
      
      Please confirm this booking and prepare for the appointment.
      
      Manage bookings: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/bookings
      
      Best regards,
      The AfroAsiaConnect Team
    `;

    return { html, text };
  }

  // Generate booking reminder email content
  generateBookingReminderEmail(booking, reminderType) {
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString();
    const reminderText = reminderType === '24h' ? '24 hours' : reminderType === '1h' ? '1 hour' : 'soon';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .button { background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Booking Reminder</h1>
            <p>Your appointment is in ${reminderText}</p>
          </div>
          
          <div class="content">
            <p>Dear ${booking.customerName},</p>
            <p>This is a friendly reminder about your upcoming appointment:</p>
            
            <div class="booking-details">
              <h3>📋 Appointment Details</h3>
              <div class="detail-row">
                <span class="label">Service:</span>
                <span>${booking.service.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Provider:</span>
                <span>${booking.provider.firstName} ${booking.provider.lastName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span>${booking.bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Duration:</span>
                <span>${booking.duration} minutes</span>
              </div>
            </div>
            
            <p>📍 Please arrive on time and bring any required materials.</p>
            <p>📞 If you need to reschedule or cancel, please contact us as soon as possible.</p>
            
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/bookings" class="button">
                View Booking Details
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The AfroAsiaConnect Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Booking Reminder - AfroAsiaConnect
      
      Dear ${booking.customerName},
      
      This is a friendly reminder about your upcoming appointment in ${reminderText}:
      
      Appointment Details:
      - Service: ${booking.service.serviceName}
      - Provider: ${booking.provider.firstName} ${booking.provider.lastName}
      - Date: ${bookingDate}
      - Time: ${booking.bookingTime}
      - Duration: ${booking.duration} minutes
      
      Please arrive on time and bring any required materials.
      
      View booking details: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/bookings
      
      Best regards,
      The AfroAsiaConnect Team
    `;

    return { html, text };
  }

  // Generate status update email content
  generateStatusUpdateEmail(booking, oldStatus) {
    const bookingDate = new Date(booking.bookingDate).toLocaleDateString();
    const statusMessages = {
      'CONFIRMED': 'Your booking has been confirmed by the service provider!',
      'CANCELLED': 'Your booking has been cancelled.',
      'COMPLETED': 'Your service has been completed. Thank you for choosing AfroAsiaConnect!',
      'IN_PROGRESS': 'Your service is currently in progress.'
    };

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366f1; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .status { padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .status-confirmed { background: #dcfce7; color: #166534; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          .status-completed { background: #dbeafe; color: #1e40af; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Booking Status Update</h1>
            <p>Your booking status has been updated</p>
          </div>
          
          <div class="content">
            <p>Dear ${booking.customerName},</p>
            <p>${statusMessages[booking.status] || 'Your booking status has been updated.'}</p>
            
            <div class="booking-details">
              <h3>📋 Booking Details</h3>
              <div class="detail-row">
                <span class="label">Booking ID:</span>
                <span>#${booking.id}</span>
              </div>
              <div class="detail-row">
                <span class="label">Service:</span>
                <span>${booking.service.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span>${booking.bookingTime}</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="status status-${booking.status.toLowerCase()}">${booking.status}</span>
              </div>
            </div>
            
            ${booking.status === 'COMPLETED' ? `
            <p>🌟 We hope you enjoyed your service! Please consider leaving a review to help other customers.</p>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>Best regards,<br>The AfroAsiaConnect Team</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Booking Status Update - AfroAsiaConnect
      
      Dear ${booking.customerName},
      
      ${statusMessages[booking.status] || 'Your booking status has been updated.'}
      
      Booking Details:
      - Booking ID: #${booking.id}
      - Service: ${booking.service.serviceName}
      - Date: ${bookingDate}
      - Time: ${booking.bookingTime}
      - Status: ${booking.status}
      
      ${booking.status === 'COMPLETED' ? 'We hope you enjoyed your service! Please consider leaving a review.' : ''}
      
      Best regards,
      The AfroAsiaConnect Team
    `;

    return { html, text };
  }
}

module.exports = new EmailService();
