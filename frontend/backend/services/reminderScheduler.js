const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');
const smsService = require('./smsService');

const prisma = new PrismaClient();

class ReminderScheduler {
  constructor() {
    this.isRunning = false;
  }

  // Start the reminder scheduler
  start() {
    if (this.isRunning) {
      console.log('⚠️ Reminder scheduler is already running');
      return;
    }

    console.log('🚀 Starting booking reminder scheduler...');

    // Schedule 24-hour reminders (runs every hour)
    this.schedule24HourReminders();

    // Schedule 1-hour reminders (runs every 15 minutes)
    this.schedule1HourReminders();

    this.isRunning = true;
    console.log('✅ Reminder scheduler started successfully');
  }

  // Stop the reminder scheduler
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Reminder scheduler is not running');
      return;
    }

    // Stop all cron jobs
    cron.getTasks().forEach(task => task.stop());
    this.isRunning = false;
    console.log('🛑 Reminder scheduler stopped');
  }

  // Schedule 24-hour reminder emails
  schedule24HourReminders() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('🔍 Checking for 24-hour reminders...');
        await this.send24HourReminders();
      } catch (error) {
        console.error('❌ Error in 24-hour reminder job:', error);
      }
    });

    console.log('📅 24-hour reminder scheduler configured (runs hourly)');
  }

  // Schedule 1-hour reminder emails
  schedule1HourReminders() {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      try {
        console.log('🔍 Checking for 1-hour reminders...');
        await this.send1HourReminders();
      } catch (error) {
        console.error('❌ Error in 1-hour reminder job:', error);
      }
    });

    console.log('⏰ 1-hour reminder scheduler configured (runs every 15 minutes)');
  }

  // Send 24-hour reminder emails
  async send24HourReminders() {
    try {
      // Calculate the time window for 24-hour reminders
      const now = new Date();
      const reminderStart = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
      const reminderEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);   // 25 hours from now

      // Find bookings that need 24-hour reminders
      const bookingsToRemind = await prisma.booking.findMany({
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED']
          },
          bookingDate: {
            gte: reminderStart,
            lte: reminderEnd
          },
          // Only send if we haven't sent a 24-hour reminder yet
          reminderSent24h: false
        },
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      console.log(`📧 Found ${bookingsToRemind.length} bookings for 24-hour reminders`);

      // Send reminder emails
      for (const booking of bookingsToRemind) {
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
            provider: booking.provider
          };

          // Send 24-hour reminder email
          await emailService.sendBookingReminder(emailBookingData, '24h');

          // Send 24-hour reminder SMS (if customer has phone and SMS enabled)
          const customerPhone = (booking.customer && booking.customer.phone)
            ? booking.customer.phone
            : booking.customerPhone;
          
          if (customerPhone) {
            const smsPrefs = (booking.customer && booking.customer.smsPreferences)
              ? booking.customer.smsPreferences
              : {};
            if (smsPrefs.smsEnabled !== false && smsPrefs.bookingReminders !== false) {
              try {
                await smsService.sendBookingReminderSMS(booking, '24h');
                console.log(`📱 24-hour SMS reminder sent for booking #${booking.id}`);
              } catch (smsError) {
                console.error(`❌ Failed to send 24-hour SMS reminder for booking #${booking.id}:`, smsError.message);
              }
            }
          }

          // Mark as reminder sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent24h: true }
          });

          console.log(`✅ 24-hour reminder sent for booking #${booking.id}`);
        } catch (error) {
          console.error(`❌ Failed to send 24-hour reminder for booking #${booking.id}:`, error.message);
        }
      }

      if (bookingsToRemind.length > 0) {
        console.log(`📊 24-hour reminders completed: ${bookingsToRemind.length} emails sent`);
      }
    } catch (error) {
      console.error('❌ Error in send24HourReminders:', error);
    }
  }

  // Send 1-hour reminder emails
  async send1HourReminders() {
    try {
      // Calculate the time window for 1-hour reminders
      const now = new Date();
      const reminderStart = new Date(now.getTime() + 45 * 60 * 1000); // 45 minutes from now
      const reminderEnd = new Date(now.getTime() + 75 * 60 * 1000);   // 75 minutes from now

      // Find bookings that need 1-hour reminders
      const bookingsToRemind = await prisma.booking.findMany({
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED']
          },
          bookingDate: {
            gte: reminderStart,
            lte: reminderEnd
          },
          // Only send if we haven't sent a 1-hour reminder yet
          reminderSent1h: false
        },
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      console.log(`📧 Found ${bookingsToRemind.length} bookings for 1-hour reminders`);

      // Send reminder emails
      for (const booking of bookingsToRemind) {
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
            provider: booking.provider
          };

          // Send 1-hour reminder email
          await emailService.sendBookingReminder(emailBookingData, '1h');

          // Send 1-hour reminder SMS (if customer has phone and SMS enabled)
          if (booking.customer.phone) {
            const smsPrefs = booking.customer.smsPreferences || {};
            if (smsPrefs.smsEnabled !== false && smsPrefs.bookingReminders !== false) {
              try {
                await smsService.sendBookingReminderSMS(booking, '1h');
                console.log(`📱 1-hour SMS reminder sent for booking #${booking.id}`);
              } catch (smsError) {
                console.error(`❌ Failed to send 1-hour SMS reminder for booking #${booking.id}:`, smsError.message);
              }
            }
          }

          // Mark as reminder sent
          await prisma.booking.update({
            where: { id: booking.id },
            data: { reminderSent1h: true }
          });

          console.log(`✅ 1-hour reminder sent for booking #${booking.id}`);
        } catch (error) {
          console.error(`❌ Failed to send 1-hour reminder for booking #${booking.id}:`, error.message);
        }
      }

      if (bookingsToRemind.length > 0) {
        console.log(`📊 1-hour reminders completed: ${bookingsToRemind.length} emails sent`);
      }
    } catch (error) {
      console.error('❌ Error in send1HourReminders:', error);
    }
  }

  // Manual trigger for testing reminders
  async testReminders() {
    console.log('🧪 Testing reminder system...');
    
    try {
      await this.send24HourReminders();
      await this.send1HourReminders();
      console.log('✅ Reminder test completed');
    } catch (error) {
      console.error('❌ Reminder test failed:', error);
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: cron.getTasks().size,
      uptime: this.isRunning ? 'Running' : 'Stopped'
    };
  }

  // Get upcoming reminders (for monitoring)
  async getUpcomingReminders() {
    try {
      const now = new Date();
      const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const upcomingBookings = await prisma.booking.findMany({
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED']
          },
          bookingDate: {
            gte: now,
            lte: next24Hours
          }
        },
        include: {
          service: {
            select: { serviceName: true }
          },
          customer: {
            select: { firstName: true, lastName: true, email: true }
          }
        },
        orderBy: {
          bookingDate: 'asc'
        }
      });

      return upcomingBookings.map(booking => ({
        id: booking.id,
        serviceName: booking.service.serviceName,
        customerName: (booking.customer && booking.customer.firstName)
          ? `${booking.customer.firstName} ${booking.customer.lastName}`
          : booking.customerName,
        customerEmail: (booking.customer && booking.customer.email)
          ? booking.customer.email
          : booking.customerEmail,
        bookingDate: booking.bookingDate,
        bookingTime: booking.bookingTime,
        reminderSent24h: booking.reminderSent24h,
        reminderSent1h: booking.reminderSent1h,
        status: booking.status
      }));
    } catch (error) {
      console.error('❌ Error getting upcoming reminders:', error);
      return [];
    }
  }
}

module.exports = new ReminderScheduler();
