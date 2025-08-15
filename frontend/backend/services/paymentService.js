const prisma = require('../prismaClient');
const emailService = require('./emailService');
const smsService = require('./smsService');

// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️  Stripe API key not found. Payment functionality will be disabled.');
}

class PaymentService {
  constructor() {
    this.stripe = stripe;
  }

  // Check if Stripe is configured
  isConfigured() {
    return !!this.stripe;
  }

  // Create a payment intent for a booking
  async createPaymentIntent(bookingId, userId) {
    if (!this.isConfigured()) {
      throw new Error('Payment service is not configured. Please add Stripe API keys.');
    }

    try {
      // Get booking details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: {
            include: {
              provider: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Verify user authorization
      if (booking.customerId !== userId) {
        throw new Error('Unauthorized to pay for this booking');
      }

      // Check if payment already exists
      if (booking.paymentStatus === 'COMPLETED') {
        throw new Error('Payment already completed for this booking');
      }

      // Calculate amount in cents (Stripe uses cents)
      const amountInCents = Math.round(booking.totalAmount * 100);

      // Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          bookingId: booking.id.toString(),
          customerId: booking.customerId.toString(),
          providerId: booking.service.providerId.toString(),
          serviceName: booking.service.serviceName
        },
        description: `Payment for ${booking.service.serviceName} - Booking #${booking.id}`,
        receipt_email: booking.customer.email,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update booking with payment intent ID
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'PROCESSING'
        }
      });

      console.log(`💳 Payment intent created for booking #${bookingId}: ${paymentIntent.id}`);

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: booking.totalAmount,
        currency: 'USD'
      };

    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }
  }

  // Confirm payment and update booking status
  async confirmPayment(paymentIntentId, bookingId) {
    try {
      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
      }

      // Get booking details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: {
            include: {
              provider: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Update booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'COMPLETED',
          status: 'CONFIRMED',
          paymentIntentId: paymentIntentId,
          paidAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create payment record
      const paymentRecord = await prisma.payment.create({
        data: {
          bookingId: bookingId,
          paymentIntentId: paymentIntentId,
          amount: booking.totalAmount,
          currency: 'USD',
          status: 'COMPLETED',
          paymentMethod: paymentIntent.payment_method_types[0] || 'card',
          stripeChargeId: paymentIntent.latest_charge,
          paidAt: new Date()
        }
      });

      // Send payment confirmation emails
      try {
        const emailBookingData = {
          id: booking.id,
          customerName: (booking.customer && booking.customer.firstName)
            ? `${booking.customer.firstName} ${booking.customer.lastName}`
            : booking.customerName,
          customerEmail: (booking.customer && booking.customer.email)
            ? booking.customer.email
            : booking.customerEmail,
          customerPhone: (booking.customer && booking.customer.phone)
            ? booking.customer.phone
            : booking.customerPhone,
          bookingDate: booking.bookingDate,
          bookingTime: booking.bookingTime,
          duration: booking.duration,
          totalAmount: booking.totalAmount,
          specialRequests: booking.specialRequests,
          service: booking.service,
          provider: booking.service.provider,
          paymentId: paymentRecord.id,
          paymentMethod: paymentRecord.paymentMethod
        };

        // Send payment confirmation to customer
        await this.sendPaymentConfirmation(emailBookingData);

        // Send payment notification to provider
        await this.sendProviderPaymentNotification(emailBookingData);

        // Send SMS payment confirmations if phone numbers are available and SMS is enabled
        // Customer payment confirmation SMS
        if (booking.customer.phone) {
          const customerSmsPrefs = booking.customer.smsPreferences || {};
          if (customerSmsPrefs.smsEnabled !== false && customerSmsPrefs.paymentConfirmations !== false) {
            try {
              await smsService.sendPaymentConfirmationSMS(booking, paymentRecord);
              console.log('📱 Customer payment confirmation SMS sent');
            } catch (smsError) {
              console.error('❌ Failed to send customer payment confirmation SMS:', smsError.message);
            }
          }
        }

      } catch (emailError) {
        console.error('❌ Error sending payment confirmation notifications:', emailError.message);
        // Don't throw error - payment was successful
      }

      console.log(`✅ Payment confirmed for booking #${bookingId}: $${booking.totalAmount}`);

      return {
        success: true,
        booking: updatedBooking,
        payment: paymentRecord,
        paymentIntent: paymentIntent
      };

    } catch (error) {
      console.error('❌ Error confirming payment:', error);
      throw error;
    }
  }

  // Handle failed payments
  async handlePaymentFailure(paymentIntentId, bookingId, reason) {
    try {
      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentStatus: 'FAILED',
          paymentFailureReason: reason,
          updatedAt: new Date()
        }
      });

      // Create failed payment record
      await prisma.payment.create({
        data: {
          bookingId: bookingId,
          paymentIntentId: paymentIntentId,
          status: 'FAILED',
          failureReason: reason,
          createdAt: new Date()
        }
      });

      console.log(`❌ Payment failed for booking #${bookingId}: ${reason}`);

      return { success: true, message: 'Payment failure recorded' };

    } catch (error) {
      console.error('❌ Error handling payment failure:', error);
      throw error;
    }
  }

  // Process refunds
  async processRefund(bookingId, amount, reason, userId) {
    try {
      // Get booking and payment details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          payments: {
            where: { status: 'COMPLETED' },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          service: {
            include: {
              provider: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          },
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (!booking.payments || booking.payments.length === 0) {
        throw new Error('No completed payment found for this booking');
      }

      // Check authorization - only customer or provider can request refund
      if (booking.customerId !== userId && booking.service.providerId !== userId) {
        throw new Error('Unauthorized to process refund for this booking');
      }

      const payment = booking.payments[0];
      const refundAmount = amount || payment.amount;

      // Process refund through Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          bookingId: bookingId.toString(),
          refundReason: reason
        }
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          paymentStatus: 'REFUNDED',
          cancellationReason: reason,
          refundedAt: new Date(),
          updatedAt: new Date()
        }
      });

      // Create refund record
      const refundRecord = await prisma.refund.create({
        data: {
          bookingId: bookingId,
          paymentId: payment.id,
          stripeRefundId: refund.id,
          amount: refundAmount,
          reason: reason,
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      console.log(`💰 Refund processed for booking #${bookingId}: $${refundAmount}`);

      return {
        success: true,
        refund: refundRecord,
        stripeRefund: refund
      };

    } catch (error) {
      console.error('❌ Error processing refund:', error);
      throw error;
    }
  }

  // Get payment history for a user
  async getPaymentHistory(userId, userType = 'customer') {
    try {
      let whereClause;
      
      if (userType === 'customer') {
        whereClause = { customerId: userId };
      } else if (userType === 'provider') {
        whereClause = {
          service: {
            providerId: userId
          }
        };
      } else {
        throw new Error('Invalid user type');
      }

      const payments = await prisma.payment.findMany({
        where: {
          booking: whereClause
        },
        include: {
          booking: {
            include: {
              service: {
                select: {
                  serviceName: true,
                  provider: {
                    select: {
                      firstName: true,
                      lastName: true
                    }
                  }
                }
              },
              customer: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          refunds: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return payments.map(payment => ({
        id: payment.id,
        bookingId: payment.bookingId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paymentMethod: payment.paymentMethod,
        paidAt: payment.paidAt,
        serviceName: payment.booking.service.serviceName,
        providerName: `${payment.booking.service.provider.firstName} ${payment.booking.service.provider.lastName}`,
        customerName: (payment.booking.customer && payment.booking.customer.firstName)
          ? `${payment.booking.customer.firstName} ${payment.booking.customer.lastName}`
          : payment.booking.customerName,
        refunds: payment.refunds,
        createdAt: payment.createdAt
      }));

    } catch (error) {
      console.error('❌ Error getting payment history:', error);
      throw error;
    }
  }

  // Get payment analytics
  async getPaymentAnalytics(providerId, startDate, endDate) {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          paidAt: {
            gte: startDate,
            lte: endDate
          },
          booking: {
            service: {
              providerId: providerId
            }
          }
        },
        include: {
          booking: {
            include: {
              service: {
                select: {
                  serviceName: true,
                  category: true
                }
              }
            }
          }
        }
      });

      // Calculate analytics
      const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalTransactions = payments.length;
      const averageTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

      // Group by service
      const revenueByService = payments.reduce((acc, payment) => {
        const serviceName = payment.booking.service.serviceName;
        if (!acc[serviceName]) {
          acc[serviceName] = { revenue: 0, transactions: 0 };
        }
        acc[serviceName].revenue += payment.amount;
        acc[serviceName].transactions += 1;
        return acc;
      }, {});

      // Group by payment method
      const revenueByMethod = payments.reduce((acc, payment) => {
        const method = payment.paymentMethod || 'card';
        if (!acc[method]) {
          acc[method] = { revenue: 0, transactions: 0 };
        }
        acc[method].revenue += payment.amount;
        acc[method].transactions += 1;
        return acc;
      }, {});

      return {
        totalRevenue,
        totalTransactions,
        averageTransactionValue,
        revenueByService,
        revenueByMethod,
        period: {
          startDate,
          endDate
        }
      };

    } catch (error) {
      console.error('❌ Error getting payment analytics:', error);
      throw error;
    }
  }

  // Send payment confirmation email
  async sendPaymentConfirmation(bookingData) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .success { color: #10b981; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💳 Payment Successful!</h1>
            <p>Your booking has been confirmed and paid</p>
          </div>
          
          <div class="content">
            <p>Dear ${bookingData.customerName},</p>
            <p class="success">✅ Your payment has been successfully processed!</p>
            
            <div class="payment-details">
              <h3>💰 Payment Details</h3>
              <div class="detail-row">
                <span class="label">Payment ID:</span>
                <span>#${bookingData.paymentId}</span>
              </div>
              <div class="detail-row">
                <span class="label">Amount Paid:</span>
                <span>$${bookingData.totalAmount}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment Method:</span>
                <span>${bookingData.paymentMethod}</span>
              </div>
              <div class="detail-row">
                <span class="label">Service:</span>
                <span>${bookingData.service.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>${new Date(bookingData.bookingDate).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span>${bookingData.bookingTime}</span>
              </div>
            </div>
            
            <p>🎉 Your booking is now confirmed! You will receive reminder emails before your appointment.</p>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing AfroAsiaConnect!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use existing email service to send
    return await emailService.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'AfroAsiaConnect <noreply@afroasiaconnect.com>',
      to: bookingData.customerEmail,
      subject: `Payment Confirmation - ${bookingData.service.serviceName}`,
      html: html
    });
  }

  // Send payment notification to provider
  async sendProviderPaymentNotification(bookingData) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9fafb; }
          .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
          .label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; }
          .success { color: #059669; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Payment Received!</h1>
            <p>You've received payment for a booking</p>
          </div>
          
          <div class="content">
            <p>Hello ${bookingData.provider.firstName},</p>
            <p class="success">✅ Payment has been received for your service!</p>
            
            <div class="payment-details">
              <h3>💰 Payment Details</h3>
              <div class="detail-row">
                <span class="label">Amount Received:</span>
                <span>$${bookingData.totalAmount}</span>
              </div>
              <div class="detail-row">
                <span class="label">Service:</span>
                <span>${bookingData.service.serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Customer:</span>
                <span>${bookingData.customerName}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>${new Date(bookingData.bookingDate).toLocaleDateString()}</span>
              </div>
              <div class="detail-row">
                <span class="label">Time:</span>
                <span>${bookingData.bookingTime}</span>
              </div>
            </div>
            
            <p>💼 The booking is now confirmed and paid. Please prepare for the appointment!</p>
          </div>
          
          <div class="footer">
            <p>AfroAsiaConnect Payment System</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Use existing email service to send
    return await emailService.transporter.sendMail({
      from: process.env.EMAIL_FROM || 'AfroAsiaConnect <noreply@afroasiaconnect.com>',
      to: bookingData.provider.email,
      subject: `Payment Received - ${bookingData.service.serviceName}`,
      html: html
    });
  }
}

module.exports = new PaymentService();
