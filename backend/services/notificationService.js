const prisma = require('../prismaClient');
const emailService = require('./emailService');
const smsService = require('./smsService');

class NotificationService {
  constructor() {
    this.io = null; // Will be set by server.js
  }

  // Set Socket.IO instance
  setSocketIO(io) {
    this.io = io;
    console.log('🔔 NotificationService: Socket.IO instance set');
  }

  // Create a new notification
  async createNotification({
    userId,
    type,
    title,
    message,
    data = {},
    priority = 'MEDIUM',
    sendEmail = false,
    sendSMS = false,
    actionUrl = null
  }) {
    try {
      // Create notification in database
      const notification = await prisma.notification.create({
        data: {
          userId: parseInt(userId),
          type,
          title,
          message,
          data: JSON.stringify(data),
          priority,
          actionUrl,
          isRead: false,
          createdAt: new Date()
        }
      });

      // Send real-time notification via WebSocket
      if (this.io) {
        this.io.to(`user_${userId}`).emit('notification', {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: JSON.parse(notification.data),
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          createdAt: notification.createdAt,
          isRead: false
        });
        console.log(`🔔 Real-time notification sent to user ${userId}`);
      }

      // Send email notification if requested
      if (sendEmail) {
        try {
          await this.sendEmailNotification(userId, notification);
        } catch (emailError) {
          console.error('❌ Failed to send email notification:', emailError.message);
        }
      }

      // Send SMS notification if requested
      if (sendSMS) {
        try {
          await this.sendSMSNotification(userId, notification);
        } catch (smsError) {
          console.error('❌ Failed to send SMS notification:', smsError.message);
        }
      }

      console.log(`✅ Notification created for user ${userId}: ${title}`);
      return notification;

    } catch (error) {
      console.error('❌ Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async listForUser(userId, { limit = 50, offset = 0, unreadOnly = false } = {}) {
    try {
      const whereClause = { userId: parseInt(userId) };
      if (unreadOnly) {
        whereClause.isRead = false;
      }

      const notifications = await prisma.notification.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return notifications.map(notification => ({
        ...notification,
        data: JSON.parse(notification.data || '{}')
      }));

    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markRead(notificationId, userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: { 
          id: parseInt(notificationId), 
          userId: parseInt(userId) 
        },
        data: { 
          isRead: true, 
          readAt: new Date(),
          updatedAt: new Date() 
        }
      });

      // Emit read status update via WebSocket
      if (this.io && result.count > 0) {
        this.io.to(`user_${userId}`).emit('notification_read', {
          notificationId: parseInt(notificationId)
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllRead(userId) {
    try {
      const result = await prisma.notification.updateMany({
        where: { 
          userId: parseInt(userId),
          isRead: false
        },
        data: { 
          isRead: true, 
          readAt: new Date(),
          updatedAt: new Date() 
        }
      });

      // Emit all read status update via WebSocket
      if (this.io && result.count > 0) {
        this.io.to(`user_${userId}`).emit('notifications_all_read');
      }

      return result;

    } catch (error) {
      console.error('❌ Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread notification count
  async getUnreadCount(userId) {
    try {
      return await prisma.notification.count({
        where: {
          userId: parseInt(userId),
          isRead: false
        }
      });
    } catch (error) {
      console.error('❌ Error getting unread count:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId, userId) {
    try {
      const result = await prisma.notification.deleteMany({
        where: {
          id: parseInt(notificationId),
          userId: parseInt(userId)
        }
      });

      // Emit deletion via WebSocket
      if (this.io && result.count > 0) {
        this.io.to(`user_${userId}`).emit('notification_deleted', {
          notificationId: parseInt(notificationId)
        });
      }

      return result;

    } catch (error) {
      console.error('❌ Error deleting notification:', error);
      throw error;
    }
  }

  // Send email notification
  async sendEmailNotification(userId, notification) {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { email: true, firstName: true, lastName: true }
      });

      if (!user || !user.email) {
        throw new Error('User email not found');
      }

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${notification.title}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9fafb; }
            .notification { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .priority-high { border-left: 4px solid #ef4444; }
            .priority-medium { border-left: 4px solid #f59e0b; }
            .priority-low { border-left: 4px solid #10b981; }
            .action-button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 10px 0; }
            .footer { text-align: center; padding: 20px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 ${notification.title}</h1>
            </div>
            
            <div class="content">
              <p>Hello ${user.firstName || 'User'},</p>
              
              <div class="notification priority-${notification.priority.toLowerCase()}">
                <h3>${notification.title}</h3>
                <p>${notification.message}</p>
                ${notification.actionUrl ? `<a href="${notification.actionUrl}" class="action-button">View Details</a>` : ''}
              </div>
            </div>
            
            <div class="footer">
              <p>AfroAsiaConnect Notifications</p>
              <p><small>You can manage your notification preferences in your dashboard.</small></p>
            </div>
          </div>
        </body>
        </html>
      `;

      await emailService.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'AfroAsiaConnect <noreply@afroasiaconnect.com>',
        to: user.email,
        subject: `🔔 ${notification.title}`,
        html: html
      });

      console.log(`📧 Email notification sent to ${user.email}`);

    } catch (error) {
      console.error('❌ Error sending email notification:', error);
      throw error;
    }
  }

  // Send SMS notification
  async sendSMSNotification(userId, notification) {
    try {
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: { 
          phone: true, 
          firstName: true, 
          smsPreferences: true 
        }
      });

      if (!user || !user.phone) {
        throw new Error('User phone number not found');
      }

      // Check SMS preferences
      const smsPrefs = user.smsPreferences || {};
      if (smsPrefs.smsEnabled === false) {
        console.log('📱 SMS notifications disabled for user');
        return;
      }

      // Create SMS message
      const smsMessage = `🔔 ${notification.title}\n\n${notification.message}${notification.actionUrl ? `\n\nView: ${notification.actionUrl}` : ''}`;

      await smsService.sendSMS(user.phone, smsMessage);
      console.log(`📱 SMS notification sent to ${user.phone}`);

    } catch (error) {
      console.error('❌ Error sending SMS notification:', error);
      throw error;
    }
  }

  // Notification type helpers
  async notifyBookingCreated(booking) {
    // Notify service provider
    await this.createNotification({
      userId: booking.service.providerId,
      type: 'BOOKING_CREATED',
      title: 'New Booking Received!',
      message: `You have a new booking for ${booking.service.serviceName} on ${new Date(booking.bookingDate).toLocaleDateString()}`,
      data: { bookingId: booking.id, serviceId: booking.serviceId },
      priority: 'HIGH',
      sendEmail: true,
      sendSMS: true,
      actionUrl: `/dashboard/bookings/${booking.id}`
    });
  }

  async notifyBookingConfirmed(booking) {
    // Notify customer
    await this.createNotification({
      userId: booking.customerId,
      type: 'BOOKING_CONFIRMED',
      title: 'Booking Confirmed!',
      message: `Your booking for ${booking.service.serviceName} has been confirmed`,
      data: { bookingId: booking.id },
      priority: 'HIGH',
      sendEmail: true,
      actionUrl: `/dashboard/bookings/${booking.id}`
    });
  }

  async notifyPaymentReceived(booking, payment) {
    // Notify service provider
    await this.createNotification({
      userId: booking.service.providerId,
      type: 'PAYMENT_RECEIVED',
      title: 'Payment Received!',
      message: `Payment of $${payment.amount} received for ${booking.service.serviceName}`,
      data: { bookingId: booking.id, paymentId: payment.id },
      priority: 'HIGH',
      sendEmail: true,
      actionUrl: `/dashboard/bookings/${booking.id}`
    });
  }

  async notifyMessageReceived(message, recipientId) {
    await this.createNotification({
      userId: recipientId,
      type: 'MESSAGE_RECEIVED',
      title: 'New Message',
      message: `You have a new message from ${message.senderName}`,
      data: { messageId: message.id, conversationId: message.conversationId },
      priority: 'MEDIUM',
      actionUrl: `/dashboard/messages?conversation=${message.conversationId}`
    });
  }

  async notifyReviewReceived(review, providerId) {
    await this.createNotification({
      userId: providerId,
      type: 'REVIEW_RECEIVED',
      title: 'New Review Received!',
      message: `You received a ${review.rating}-star review for ${review.service.serviceName}`,
      data: { reviewId: review.id, serviceId: review.serviceId },
      priority: 'MEDIUM',
      sendEmail: true,
      actionUrl: `/dashboard/reviews`
    });
  }
}

module.exports = new NotificationService();
