const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const bookingService = require('../services/bookingService');
const serviceService = require('../services/serviceService');

// Mock booking data for demo (replace with actual database)
let bookings = [];
let bookingIdCounter = 1;

// POST /api/bookings - Create a new booking
router.post('/', async (req, res) => {
  try {
    const {
      serviceId,
      date,
      time,
      customerName,
      customerEmail,
      customerPhone,
      specialRequests,
      duration
    } = req.body;

    // Validate required fields
    if (!serviceId || !date || !time || !customerName || !customerEmail) {
      return res.status(400).json({
        error: 'Missing required fields: serviceId, date, time, customerName, customerEmail'
      });
    }

    // Get service details to calculate total amount and get provider
    const service = await serviceService.findUnique(serviceId);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Calculate total amount
    const bookingDuration = parseInt(duration) || service.duration || 60;
    const totalAmount = service.price * (bookingDuration / 60); // Assuming price is per hour

    // Create booking data
    const bookingData = {
      serviceId: parseInt(serviceId),
      customerId: req.user ? req.user.id : null, // Optional for guest bookings
      providerId: service.userId,
      date,
      time,
      duration: bookingDuration,
      totalAmount,
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      specialRequests: specialRequests || null
    };

    // Create booking using service
    const newBooking = await bookingService.createBooking(bookingData);

    console.log('📅 New booking created:', {
      id: newBooking.id,
      service: service.serviceName,
      customer: customerName,
      date: date,
      time: time
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      booking: newBooking
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      error: 'Failed to create booking',
      message: error.message
    });
  }
});

// GET /api/bookings - Get all bookings (with optional filters)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { serviceId, date, status, customerEmail } = req.query;
    let filteredBookings = [...bookings];

    // Apply filters
    if (serviceId) {
      filteredBookings = filteredBookings.filter(b => b.serviceId === parseInt(serviceId));
    }
    if (date) {
      filteredBookings = filteredBookings.filter(b => b.date === date);
    }
    if (status) {
      filteredBookings = filteredBookings.filter(b => b.status === status);
    }
    if (customerEmail) {
      filteredBookings = filteredBookings.filter(b => 
        b.customerEmail.toLowerCase().includes(customerEmail.toLowerCase())
      );
    }

    // Sort by date and time
    filteredBookings.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA - dateB;
    });

    res.json({
      success: true,
      bookings: filteredBookings,
      total: filteredBookings.length
    });

  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      error: 'Failed to fetch bookings',
      message: error.message
    });
  }
});

// GET /api/bookings/:id - Get specific booking
router.get('/:id', async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = bookings.find(b => b.id === bookingId);

    if (!booking) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      error: 'Failed to fetch booking',
      message: error.message
    });
  }
});

// PUT /api/bookings/:id - Update booking
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    const {
      date,
      time,
      customerName,
      customerEmail,
      customerPhone,
      requirements,
      duration,
      status
    } = req.body;

    // Update booking
    const updatedBooking = {
      ...bookings[bookingIndex],
      ...(date && { date }),
      ...(time && { time }),
      ...(customerName && { customerName }),
      ...(customerEmail && { customerEmail }),
      ...(customerPhone !== undefined && { customerPhone }),
      ...(requirements !== undefined && { requirements }),
      ...(duration && { duration: parseInt(duration) }),
      ...(status && { status }),
      updatedAt: new Date().toISOString()
    };

    bookings[bookingIndex] = updatedBooking;

    console.log('📅 Booking updated:', {
      id: bookingId,
      changes: req.body
    });

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: updatedBooking
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({
      error: 'Failed to update booking',
      message: error.message
    });
  }
});

// DELETE /api/bookings/:id - Cancel/Delete booking
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);

    if (bookingIndex === -1) {
      return res.status(404).json({
        error: 'Booking not found'
      });
    }

    const deletedBooking = bookings.splice(bookingIndex, 1)[0];

    console.log('📅 Booking cancelled:', {
      id: bookingId,
      customer: deletedBooking.customerName
    });

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: deletedBooking
    });

  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({
      error: 'Failed to cancel booking',
      message: error.message
    });
  }
});

// GET /api/bookings/availability/:serviceId - Check availability for a service
router.get('/availability/:serviceId', async (req, res) => {
  try {
    const serviceId = parseInt(req.params.serviceId);
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Date parameter is required'
      });
    }

    // Use booking service to check availability
    const availability = await bookingService.checkAvailability(serviceId, date);

    res.json({
      success: true,
      date: availability.date,
      serviceId,
      availableSlots: availability.availableSlots,
      serviceDuration: availability.serviceDuration
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      error: 'Failed to check availability',
      message: error.message
    });
  }
});

// GET /api/bookings/stats/overview - Get booking statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    const stats = {
      total: bookings.length,
      today: bookings.filter(b => b.date === today).length,
      thisMonth: bookings.filter(b => b.date.startsWith(thisMonth)).length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      pending: bookings.filter(b => b.status === 'pending').length
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({
      error: 'Failed to fetch booking statistics',
      message: error.message
    });
  }
});

module.exports = router;
