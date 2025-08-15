const twilio = require('twilio');
const prisma = require('../prismaClient');

class SMSService {
  constructor() {
    // Initialize Twilio client
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_PHONE_NUMBER;
    
    if (this.accountSid && this.authToken) {
      this.client = twilio(this.accountSid, this.authToken);
    } else {
      console.warn('⚠️  Twilio credentials not configured. SMS functionality will be disabled.');
      this.client = null;
    }
  }

  // Format phone number to international format
  formatPhoneNumber(phoneNumber, countryCode = '+1') {
    if (!phoneNumber) return null;
    
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it starts with country code, return as is
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      return `+${cleaned}`;
    }
    
    // If it's a 10-digit US number, add +1
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }
    
    // If it already has a + sign, return as is
    if (phoneNumber.startsWith('+')) {
      return phoneNumber;
    }
    
    // Default to adding country code
    return `${countryCode}${cleaned}`;
  }

  // Validate phone number format
  isValidPhoneNumber(phoneNumber) {
    const formatted = this.formatPhoneNumber(phoneNumber);
    if (!formatted) return false;
    
    // Basic validation for international format
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(formatted);
  }

  // Send SMS message
  async sendSMS(to, message, options = {}) {
    try {
      if (!this.client) {
        console.log('📱 SMS Service not configured. Would send:', { to, message });
        return { success: false, error: 'SMS service not configured' };
      }

      const formattedNumber = this.formatPhoneNumber(to);
      if (!this.isValidPhoneNumber(formattedNumber)) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      const messageOptions = {
        body: message,
        from: this.fromNumber,
        to: formattedNumber,
        ...options
      };

      const result = await this.client.messages.create(messageOptions);
      
      // Log SMS for analytics
      await this.logSMS({
        to: formattedNumber,
        message,
        status: 'sent',
        twilioSid: result.sid,
        cost: result.price || 0,
        ...options
      });

      console.log(`📱 SMS sent successfully to ${formattedNumber}: ${result.sid}`);
      return { 
        success: true, 
        sid: result.sid, 
        status: result.status,
        to: formattedNumber
      };

    } catch (error) {
      console.error('❌ SMS sending failed:', error);
      
      // Log failed SMS
      await this.logSMS({
        to: this.formatPhoneNumber(to),
        message,
        status: 'failed',
        error: error.message,
        ...options
      });

      return { 
        success: false, 
        error: error.message 
      };
    }
  }

  // Send booking confirmation SMS
  async sendBookingConfirmationSMS(booking) {
    try {
      const customer = await prisma.user.findUnique({
        where: { id: booking.customerId },
        include: {
          customerBookings: {
            where: { id: booking.id },
            include: {
              service: {
                include: {
                  provider: {
                    select: {
                      firstName: true,
                      lastName: true,
                      businessName: true,
                      phone: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!customer?.phone) {
        console.log('📱 No phone number for customer, skipping SMS');
        return { success: false, error: 'No phone number available' };
      }

      const service = customer.customerBookings[0]?.service;
      const provider = service?.provider;
      
      const message = this.generateBookingConfirmationMessage({
        customerName: customer.firstName || 'Customer',
        serviceName: service?.serviceName || 'Service',
        providerName: provider?.businessName || `${provider?.firstName} ${provider?.lastName}` || 'Provider',
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        totalAmount: booking.totalAmount,
        bookingId: booking.id
      });

      return await this.sendSMS(customer.phone, message, {
        type: 'booking_confirmation',
        bookingId: booking.id,
        customerId: customer.id
      });

    } catch (error) {
      console.error('❌ Error sending booking confirmation SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Send booking reminder SMS
  async sendBookingReminderSMS(booking, reminderType = '24h') {
    try {
      const customer = await prisma.user.findUnique({
        where: { id: booking.customerId },
        include: {
          customerBookings: {
            where: { id: booking.id },
            include: {
              service: {
                include: {
                  provider: {
                    select: {
                      firstName: true,
                      lastName: true,
                      businessName: true,
                      phone: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!customer?.phone) {
        console.log('📱 No phone number for customer, skipping SMS reminder');
        return { success: false, error: 'No phone number available' };
      }

      const service = customer.customerBookings[0]?.service;
      const provider = service?.provider;
      
      const message = this.generateBookingReminderMessage({
        customerName: customer.firstName || 'Customer',
        serviceName: service?.serviceName || 'Service',
        providerName: provider?.businessName || `${provider?.firstName} ${provider?.lastName}` || 'Provider',
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        reminderType,
        providerPhone: provider?.phone,
        bookingId: booking.id
      });

      return await this.sendSMS(customer.phone, message, {
        type: `booking_reminder_${reminderType}`,
        bookingId: booking.id,
        customerId: customer.id
      });

    } catch (error) {
      console.error('❌ Error sending booking reminder SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Send provider notification SMS
  async sendProviderNotificationSMS(booking) {
    try {
      const provider = await prisma.user.findUnique({
        where: { id: booking.service?.providerId || booking.providerId },
        include: {
          services: {
            where: { id: booking.serviceId },
            take: 1
          }
        }
      });

      if (!provider?.phone) {
        console.log('📱 No phone number for provider, skipping SMS');
        return { success: false, error: 'No phone number available' };
      }

      const customer = await prisma.user.findUnique({
        where: { id: booking.customerId },
        select: { firstName: true, lastName: true, phone: true }
      });

      const service = provider.services[0];
      
      const message = this.generateProviderNotificationMessage({
        providerName: provider.firstName || 'Provider',
        serviceName: service?.serviceName || 'Service',
        customerName: `${customer?.firstName || ''} ${customer?.lastName || ''}`.trim() || 'Customer',
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        customerPhone: customer?.phone,
        totalAmount: booking.totalAmount,
        bookingId: booking.id
      });

      return await this.sendSMS(provider.phone, message, {
        type: 'provider_notification',
        bookingId: booking.id,
        providerId: provider.id
      });

    } catch (error) {
      console.error('❌ Error sending provider notification SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Send booking status update SMS
  async sendBookingStatusUpdateSMS(booking, oldStatus, newStatus) {
    try {
      const customer = await prisma.user.findUnique({
        where: { id: booking.customerId },
        include: {
          customerBookings: {
            where: { id: booking.id },
            include: {
              service: {
                include: {
                  provider: {
                    select: {
                      firstName: true,
                      lastName: true,
                      businessName: true,
                      phone: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!customer?.phone) {
        console.log('📱 No phone number for customer, skipping status update SMS');
        return { success: false, error: 'No phone number available' };
      }

      const service = customer.customerBookings[0]?.service;
      const provider = service?.provider;
      
      const message = this.generateStatusUpdateMessage({
        customerName: customer.firstName || 'Customer',
        serviceName: service?.serviceName || 'Service',
        providerName: provider?.businessName || `${provider?.firstName} ${provider?.lastName}` || 'Provider',
        oldStatus,
        newStatus,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        providerPhone: provider?.phone,
        bookingId: booking.id
      });

      return await this.sendSMS(customer.phone, message, {
        type: 'status_update',
        bookingId: booking.id,
        customerId: customer.id,
        oldStatus,
        newStatus
      });

    } catch (error) {
      console.error('❌ Error sending status update SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Send payment confirmation SMS
  async sendPaymentConfirmationSMS(payment) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        include: {
          customer: {
            select: { firstName: true, phone: true }
          },
          service: {
            include: {
              provider: {
                select: {
                  firstName: true,
                  lastName: true,
                  businessName: true
                }
              }
            }
          }
        }
      });

      if (!booking?.customer?.phone) {
        console.log('📱 No phone number for customer, skipping payment confirmation SMS');
        return { success: false, error: 'No phone number available' };
      }

      const message = this.generatePaymentConfirmationMessage({
        customerName: booking.customer.firstName || 'Customer',
        serviceName: booking.service?.serviceName || 'Service',
        providerName: booking.service?.provider?.businessName || 
                     `${booking.service?.provider?.firstName} ${booking.service?.provider?.lastName}` || 'Provider',
        amount: payment.amount,
        paymentMethod: payment.paymentMethod || 'Card',
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        paymentId: payment.id
      });

      return await this.sendSMS(booking.customer.phone, message, {
        type: 'payment_confirmation',
        paymentId: payment.id,
        bookingId: booking.id,
        customerId: booking.customer.id
      });

    } catch (error) {
      console.error('❌ Error sending payment confirmation SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Send two-factor authentication SMS
  async sendTwoFactorSMS(userId, code) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, phone: true }
      });

      if (!user?.phone) {
        return { success: false, error: 'No phone number available' };
      }

      const message = `Hi ${user.firstName || 'there'}! Your AfroAsiaConnect verification code is: ${code}. This code expires in 10 minutes. Never share this code with anyone.`;

      return await this.sendSMS(user.phone, message, {
        type: 'two_factor_auth',
        userId: userId
      });

    } catch (error) {
      console.error('❌ Error sending 2FA SMS:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate booking confirmation message
  generateBookingConfirmationMessage(data) {
    const { customerName, serviceName, providerName, bookingDate, bookingTime, totalAmount, bookingId } = data;
    const formattedDate = new Date(bookingDate).toLocaleDateString();
    const formattedTime = bookingTime;
    
    return `Hi ${customerName}! Your booking is confirmed ✅

Service: ${serviceName}
Provider: ${providerName}
Date: ${formattedDate}
Time: ${formattedTime}
Amount: $${totalAmount}

Booking ID: #${bookingId}

We'll send you reminders before your appointment. Thank you for choosing AfroAsiaConnect!`;
  }

  // Generate booking reminder message
  generateBookingReminderMessage(data) {
    const { customerName, serviceName, providerName, bookingDate, bookingTime, reminderType, providerPhone, bookingId } = data;
    const formattedDate = new Date(bookingDate).toLocaleDateString();
    const timeText = reminderType === '1h' ? 'in 1 hour' : 'tomorrow';
    
    let message = `Hi ${customerName}! Reminder: Your appointment is ${timeText} ⏰

Service: ${serviceName}
Provider: ${providerName}
Date: ${formattedDate}
Time: ${bookingTime}`;

    if (providerPhone) {
      message += `\nProvider: ${providerPhone}`;
    }

    message += `\n\nBooking ID: #${bookingId}
Please arrive on time. Contact us if you need to reschedule.`;

    return message;
  }

  // Generate provider notification message
  generateProviderNotificationMessage(data) {
    const { providerName, serviceName, customerName, bookingDate, bookingTime, customerPhone, totalAmount, bookingId } = data;
    const formattedDate = new Date(bookingDate).toLocaleDateString();
    
    let message = `Hi ${providerName}! New booking received 🎉

Service: ${serviceName}
Customer: ${customerName}
Date: ${formattedDate}
Time: ${bookingTime}
Amount: $${totalAmount}`;

    if (customerPhone) {
      message += `\nCustomer: ${customerPhone}`;
    }

    message += `\n\nBooking ID: #${bookingId}
Please confirm or update the booking status in your dashboard.`;

    return message;
  }

  // Generate status update message
  generateStatusUpdateMessage(data) {
    const { customerName, serviceName, providerName, oldStatus, newStatus, bookingDate, bookingTime, providerPhone, bookingId } = data;
    const formattedDate = new Date(bookingDate).toLocaleDateString();
    
    const statusMessages = {
      'CONFIRMED': 'confirmed ✅',
      'CANCELLED': 'cancelled ❌',
      'COMPLETED': 'completed ✅',
      'IN_PROGRESS': 'in progress 🔄',
      'NO_SHOW': 'marked as no-show ⚠️'
    };

    let message = `Hi ${customerName}! Your booking has been ${statusMessages[newStatus] || newStatus.toLowerCase()}

Service: ${serviceName}
Provider: ${providerName}
Date: ${formattedDate}
Time: ${bookingTime}`;

    if (newStatus === 'CANCELLED') {
      message += '\n\nIf you have any questions, please contact support.';
    } else if (newStatus === 'CONFIRMED') {
      message += '\n\nWe look forward to serving you!';
      if (providerPhone) {
        message += `\nProvider: ${providerPhone}`;
      }
    }

    message += `\n\nBooking ID: #${bookingId}`;

    return message;
  }

  // Generate payment confirmation message
  generatePaymentConfirmationMessage(data) {
    const { customerName, serviceName, providerName, amount, paymentMethod, bookingDate, bookingTime, paymentId } = data;
    const formattedDate = new Date(bookingDate).toLocaleDateString();
    
    return `Hi ${customerName}! Payment confirmed ✅

Service: ${serviceName}
Provider: ${providerName}
Amount: $${amount}
Method: ${paymentMethod}

Appointment Details:
Date: ${formattedDate}
Time: ${bookingTime}

Payment ID: #${paymentId}
Thank you for your payment!`;
  }

  // Log SMS for analytics and tracking
  async logSMS(smsData) {
    try {
      // This would typically go to a separate SMS logs table
      // For now, we'll just log to console in development
      console.log('📱 SMS Log:', {
        timestamp: new Date().toISOString(),
        ...smsData
      });
      
      // In production, you might want to store this in a database table
      // await prisma.smsLog.create({ data: smsData });
      
    } catch (error) {
      console.error('❌ Error logging SMS:', error);
    }
  }

  // Get SMS delivery status
  async getSMSStatus(sid) {
    try {
      if (!this.client) {
        return { success: false, error: 'SMS service not configured' };
      }

      const message = await this.client.messages(sid).fetch();
      return {
        success: true,
        status: message.status,
        dateCreated: message.dateCreated,
        dateSent: message.dateSent,
        price: message.price,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage
      };

    } catch (error) {
      console.error('❌ Error fetching SMS status:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk SMS sending (for marketing or announcements)
  async sendBulkSMS(recipients, message, options = {}) {
    const results = [];
    
    for (const recipient of recipients) {
      const result = await this.sendSMS(recipient.phone, message, {
        ...options,
        userId: recipient.id,
        type: 'bulk_sms'
      });
      
      results.push({
        recipient: recipient.phone,
        userId: recipient.id,
        ...result
      });
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  // Test SMS functionality
  async testSMS(phoneNumber) {
    const testMessage = `Hello! This is a test message from AfroAsiaConnect. SMS service is working correctly! 🎉

Time: ${new Date().toLocaleString()}
Platform: AfroAsiaConnect`;

    return await this.sendSMS(phoneNumber, testMessage, {
      type: 'test_message'
    });
  }

  // Generate verification code
  generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send SMS verification code
  async sendVerificationCode(userId, phoneNumber) {
    try {
      // Format phone number
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      if (!this.isValidPhoneNumber(formattedPhone)) {
        throw new Error('Invalid phone number format');
      }

      // Generate verification code
      const code = this.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Clear any existing unused codes for this user and phone
      await prisma.verificationCode.deleteMany({
        where: {
          userId: userId,
          phone: formattedPhone,
          isUsed: false
        }
      });

      // Store verification code in database
      const verificationRecord = await prisma.verificationCode.create({
        data: {
          userId: userId,
          phone: formattedPhone,
          code: code,
          type: 'SMS_VERIFICATION',
          expiresAt: expiresAt
        }
      });

      // Send SMS
      const message = `Your AfroAsiaConnect verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this message.`;
      
      const smsResult = await this.sendSMS(formattedPhone, message, {
        type: 'verification_code',
        userId: userId
      });

      return {
        success: true,
        verificationId: verificationRecord.id,
        expiresAt: expiresAt,
        smsResult: smsResult
      };

    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  }

  // Verify SMS code
  async verifyCode(userId, phoneNumber, code) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Find the verification code
      const verificationRecord = await prisma.verificationCode.findFirst({
        where: {
          userId: userId,
          phone: formattedPhone,
          code: code,
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        }
      });

      if (!verificationRecord) {
        return {
          success: false,
          error: 'Invalid or expired verification code'
        };
      }

      // Mark code as used
      await prisma.verificationCode.update({
        where: {
          id: verificationRecord.id
        },
        data: {
          isUsed: true,
          updatedAt: new Date()
        }
      });

      // Update user's phone number as verified
      await prisma.user.update({
        where: {
          id: userId
        },
        data: {
          phone: formattedPhone
        }
      });

      return {
        success: true,
        message: 'Phone number verified successfully'
      };

    } catch (error) {
      console.error('Error verifying code:', error);
      throw error;
    }
  }

  // Check if phone number is verified for user
  async isPhoneVerified(userId, phoneNumber) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const verifiedCode = await prisma.verificationCode.findFirst({
        where: {
          userId: userId,
          phone: formattedPhone,
          isUsed: true
        }
      });

      return !!verifiedCode;
    } catch (error) {
      console.error('Error checking phone verification:', error);
      return false;
    }
  }

  // Send booking confirmation SMS to customer
  async sendBookingConfirmationSMS(booking) {
    try {
      // Check if customer has phone and SMS preferences allow booking confirmations
      const customerPhone = booking.customerPhone || (booking.customer && booking.customer.phone);
      if (!customerPhone) {
        console.log('📱 No customer phone number available for booking confirmation SMS');
        return { success: false, reason: 'No phone number' };
      }

      // Check SMS preferences if customer is registered
      if (booking.customer && booking.customer.smsPreferences) {
        const smsPrefs = booking.customer.smsPreferences;
        if (smsPrefs.smsEnabled === false || smsPrefs.bookingConfirmations === false) {
          console.log('📱 Customer has disabled booking confirmation SMS');
          return { success: false, reason: 'SMS disabled by user' };
        }
      }

      // Format booking date and time
      const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create confirmation message
      const message = `🎉 Booking Confirmed!

Service: ${booking.service.serviceName}
Date: ${bookingDate}
Time: ${booking.bookingTime}
Duration: ${booking.duration} minutes
Total: $${booking.totalAmount}

Booking ID: #${booking.id}

Thank you for choosing AfroAsiaConnect!`;

      // Send SMS
      const result = await this.sendSMS(customerPhone, message, {
        type: 'booking_confirmation',
        userId: booking.customerId,
        bookingId: booking.id
      });

      return result;

    } catch (error) {
      console.error('Error sending booking confirmation SMS:', error);
      throw error;
    }
  }

  // Send booking notification SMS to service provider
  async sendProviderNotificationSMS(booking) {
    try {
      // Get provider details with phone number
      const provider = await prisma.user.findUnique({
        where: { id: booking.providerId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          smsPreferences: true
        }
      });

      if (!provider || !provider.phone) {
        console.log('📱 No provider phone number available for booking notification SMS');
        return { success: false, reason: 'No phone number' };
      }

      // Check SMS preferences
      if (provider.smsPreferences) {
        const smsPrefs = provider.smsPreferences;
        if (smsPrefs.smsEnabled === false || smsPrefs.bookingConfirmations === false) {
          console.log('📱 Provider has disabled booking notification SMS');
          return { success: false, reason: 'SMS disabled by user' };
        }
      }

      // Format booking date and time
      const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create notification message
      const customerName = booking.customerName || `${booking.customer?.firstName} ${booking.customer?.lastName}`.trim();
      const message = `📅 New Booking Alert!

Customer: ${customerName}
Service: ${booking.service.serviceName}
Date: ${bookingDate}
Time: ${booking.bookingTime}
Duration: ${booking.duration} minutes
Amount: $${booking.totalAmount}

Booking ID: #${booking.id}

Login to manage your booking.`;

      // Send SMS
      const result = await this.sendSMS(provider.phone, message, {
        type: 'booking_notification',
        userId: provider.id,
        bookingId: booking.id
      });

      return result;

    } catch (error) {
      console.error('Error sending provider notification SMS:', error);
      throw error;
    }
  }

  // Send booking reminder SMS
  async sendBookingReminderSMS(booking, reminderType = '24h') {
    try {
      const customerPhone = booking.customerPhone || (booking.customer && booking.customer.phone);
      if (!customerPhone) {
        return { success: false, reason: 'No phone number' };
      }

      // Check SMS preferences
      if (booking.customer && booking.customer.smsPreferences) {
        const smsPrefs = booking.customer.smsPreferences;
        if (smsPrefs.smsEnabled === false || smsPrefs.bookingReminders === false) {
          return { success: false, reason: 'SMS disabled by user' };
        }
      }

      const bookingDate = new Date(booking.bookingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });

      const reminderText = reminderType === '24h' ? 'tomorrow' : 'in 1 hour';
      const message = `⏰ Booking Reminder

Your appointment is ${reminderText}!

Service: ${booking.service.serviceName}
Date: ${bookingDate}
Time: ${booking.bookingTime}
Booking ID: #${booking.id}

See you soon!`;

      const result = await this.sendSMS(customerPhone, message, {
        type: 'booking_reminder',
        userId: booking.customerId,
        bookingId: booking.id
      });

      return result;

    } catch (error) {
      console.error('Error sending booking reminder SMS:', error);
      throw error;
    }
  }
}

module.exports = new SMSService();
