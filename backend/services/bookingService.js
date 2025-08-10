const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');
const smsService = require('./smsService');
const prisma = new PrismaClient();

class BookingService {
  // Create a new booking
  async createBooking(bookingData) {
    try {
      const booking = await prisma.booking.create({
        data: {
          serviceId: parseInt(bookingData.serviceId),
          customerId: bookingData.customerId ? parseInt(bookingData.customerId) : null,
          providerId: parseInt(bookingData.providerId),
          bookingDate: new Date(bookingData.date),
          bookingTime: bookingData.time,
          duration: parseInt(bookingData.duration),
          totalAmount: parseFloat(bookingData.totalAmount),
          customerName: bookingData.customerName,
          customerEmail: bookingData.customerEmail,
          customerPhone: bookingData.customerPhone || null,
          specialRequests: bookingData.specialRequests || null,
          status: 'PENDING'
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

      // Return the created booking with all related data
      const createdBooking = await prisma.booking.findUnique({
        where: { id: booking.id },
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

      // Send email notifications asynchronously
      try {
        console.log('🔍 Starting notification process...');
        console.log('🔍 Customer object:', JSON.stringify(createdBooking.customer, null, 2));
        console.log('🔍 Customer name from booking:', createdBooking.customerName);
        
        // Format booking data for email service
        // Handle both registered users and guest bookings
        const customerName = (createdBooking.customer && createdBooking.customer.firstName)
          ? `${createdBooking.customer.firstName} ${createdBooking.customer.lastName}`
          : createdBooking.customerName;
        const customerEmail = (createdBooking.customer && createdBooking.customer.email)
          ? createdBooking.customer.email 
          : createdBooking.customerEmail;
        const customerPhone = (createdBooking.customer && createdBooking.customer.phone)
          ? createdBooking.customer.phone 
          : createdBooking.customerPhone;

        const emailBookingData = {
          id: createdBooking.id,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          bookingDate: createdBooking.bookingDate,
          bookingTime: createdBooking.bookingTime,
          duration: createdBooking.duration,
          totalAmount: createdBooking.totalAmount,
          specialRequests: createdBooking.specialRequests,
          service: createdBooking.service,
          provider: createdBooking.provider
        };

        // Send confirmation email to customer
        emailService.sendBookingConfirmation(emailBookingData)
          .then(() => console.log('✅ Customer confirmation email sent'))
          .catch(error => console.error('❌ Failed to send customer confirmation:', error.message));

        // Send notification email to provider
        emailService.sendProviderNotification(emailBookingData)
          .then(() => console.log('✅ Provider notification email sent'))
          .catch(error => console.error('❌ Failed to send provider notification:', error.message));

        // Send SMS notifications if phone numbers are available and SMS is enabled
        // Customer confirmation SMS
        if (customerPhone) {
          // For registered users, check SMS preferences; for guests, send by default
          const shouldSendSMS = (createdBooking.customer && createdBooking.customer.firstName)
            ? (() => {
                const customerSmsPrefs = createdBooking.customer.smsPreferences || {};
                return customerSmsPrefs.smsEnabled !== false && customerSmsPrefs.bookingConfirmations !== false;
              })()
            : true; // Send SMS for guest bookings by default

          if (shouldSendSMS) {
            smsService.sendBookingConfirmationSMS(createdBooking)
              .then(() => console.log('📱 Customer confirmation SMS sent'))
              .catch(error => console.error('❌ Failed to send customer confirmation SMS:', error.message));
          }
        }

        // Provider notification SMS
        smsService.sendProviderNotificationSMS(createdBooking)
          .then(() => console.log('📱 Provider notification SMS sent'))
          .catch(error => console.error('❌ Failed to send provider notification SMS:', error.message));

      } catch (error) {
        console.error('❌ Notification error:', error.message);
        // Don't throw error - booking was successful, email is secondary
      }

      return createdBooking;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  }

  // Get bookings for a user (customer or provider)
  async getUserBookings(userId, role = 'customer', filters = {}) {
    try {
      const where = {};
      
      if (role === 'customer') {
        where.customerId = parseInt(userId);
      } else if (role === 'provider') {
        where.providerId = parseInt(userId);
      }

      // Apply filters
      if (filters.status) {
        where.status = filters.status;
      }
      
      if (filters.dateFrom) {
        where.bookingDate = {
          ...where.bookingDate,
          gte: new Date(filters.dateFrom)
        };
      }
      
      if (filters.dateTo) {
        where.bookingDate = {
          ...where.bookingDate,
          lte: new Date(filters.dateTo)
        };
      }

      const bookings = await prisma.booking.findMany({
        where,
        include: {
          service: true,
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          provider: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return bookings;
    } catch (error) {
      console.error('Error fetching user bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  }

  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(bookingId) },
        include: {
          service: true,
          customer: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          provider: {
            select: { id: true, firstName: true, lastName: true, email: true }
          },
          review: true
        }
      });

      return booking;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw new Error('Failed to fetch booking');
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, newStatus, userId) {
    try {
      // First, get the current booking to check authorization
      const currentBooking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
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

      if (!currentBooking) {
        throw new Error('Booking not found');
      }

      // Check authorization - only customer or provider can update
      if (currentBooking.customerId !== userId && currentBooking.service.providerId !== userId) {
        throw new Error('Unauthorized to update this booking');
      }

      const oldStatus = currentBooking.status;

      // Update the booking status
      const updatedBooking = await prisma.booking.update({
        where: { id: bookingId },
        data: { 
          status: newStatus,
          updatedAt: new Date()
        },
        include: {
          service: true,
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
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

      // Send status update email notification
      try {
        const emailBookingData = {
          id: updatedBooking.id,
          customerName: `${updatedBooking.customer.firstName} ${updatedBooking.customer.lastName}`,
          customerEmail: updatedBooking.customer.email,
          bookingDate: updatedBooking.bookingDate,
          bookingTime: updatedBooking.bookingTime,
          duration: updatedBooking.duration,
          totalAmount: updatedBooking.totalAmount,
          status: updatedBooking.status,
          service: updatedBooking.service,
          provider: updatedBooking.provider
        };

        // Send status update email to customer
        emailService.sendBookingStatusUpdate(emailBookingData, oldStatus)
          .then(() => console.log('✅ Status update email sent'))
          .catch(error => console.error('❌ Failed to send status update email:', error.message));

        // Send SMS status update notification if customer has phone and SMS enabled
        if (updatedBooking.customer.phone) {
          const customerSmsPrefs = updatedBooking.customer.smsPreferences || {};
          if (customerSmsPrefs.smsEnabled !== false && customerSmsPrefs.statusUpdates !== false) {
            smsService.sendBookingStatusUpdateSMS(updatedBooking, oldStatus)
              .then(() => console.log('📱 Status update SMS sent'))
              .catch(error => console.error('❌ Failed to send status update SMS:', error.message));
          }
        }

      } catch (error) {
        console.error('❌ Notification error:', error.message);
        // Don't throw error - booking update was successful
      }

      return updatedBooking;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  }

  // Cancel booking
  async cancelBooking(bookingId, userId, reason = null) {
    try {
      return await this.updateBookingStatus(bookingId, 'CANCELLED', userId);
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  // Check availability for a service on a specific date
  async checkAvailability(serviceId, date) {
    try {
      const service = await prisma.service.findUnique({
        where: { id: parseInt(serviceId) },
        include: {
          user: {
            include: {
              workingHours: true
            }
          }
        }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      // Get existing bookings for the date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const existingBookings = await prisma.booking.findMany({
        where: {
          serviceId: parseInt(serviceId),
          bookingDate: {
            gte: startOfDay,
            lte: endOfDay
          },
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
          }
        }
      });

      // Generate available time slots (simplified - 9 AM to 5 PM, hourly slots)
      const availableSlots = [];
      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Default working hours if not specified
      const workingHours = service.user.workingHours.find(wh => wh.weekday === dayOfWeek);
      const startHour = workingHours ? workingHours.startTime.split(':')[0] : 9;
      const endHour = workingHours ? workingHours.endTime.split(':')[0] : 17;

      for (let hour = parseInt(startHour); hour < parseInt(endHour); hour++) {
        const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
        
        // Check if this time slot is already booked
        const isBooked = existingBookings.some(booking => 
          booking.bookingTime === timeSlot
        );

        if (!isBooked) {
          availableSlots.push(timeSlot);
        }
      }

      return {
        date,
        availableSlots,
        serviceDuration: service.duration
      };
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  // Get booking statistics for a provider
  async getBookingStats(providerId, dateRange = {}) {
    try {
      const where = {
        providerId: parseInt(providerId)
      };

      if (dateRange.from) {
        where.createdAt = {
          ...where.createdAt,
          gte: new Date(dateRange.from)
        };
      }

      if (dateRange.to) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(dateRange.to)
        };
      }

      const [
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue
      ] = await Promise.all([
        prisma.booking.count({ where }),
        prisma.booking.count({ where: { ...where, status: 'PENDING' } }),
        prisma.booking.count({ where: { ...where, status: 'CONFIRMED' } }),
        prisma.booking.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.booking.count({ where: { ...where, status: 'CANCELLED' } }),
        prisma.booking.aggregate({
          where: { ...where, status: 'COMPLETED' },
          _sum: { totalAmount: true }
        })
      ]);

      return {
        totalBookings,
        pendingBookings,
        confirmedBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        conversionRate: totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(1) : 0
      };
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      throw new Error('Failed to fetch booking statistics');
    }
  }
}

module.exports = new BookingService();
