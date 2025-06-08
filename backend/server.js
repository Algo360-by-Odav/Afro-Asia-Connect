require('dotenv').config(); // Load environment variables at the very top
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth'); // Import auth routes
const listingRoutes = require('./routes/listings');
const leadRoutes = require('./routes/leads'); // Added leads routes // Import listing routes
const subscriptionRoutes = require('./routes/subscriptions'); // Import subscription routes
const notificationRoutes = require('./routes/notifications'); // Import notification routes
const eventRoutes = require('./routes/events'); // Import event routes

const app = express();
const PORT = process.env.PORT || 3001; // Backend server port, now respects .env

// Middleware to parse JSON bodies and cookies
app.use(cookieParser()); // Middleware to parse cookies
app.use(express.json());

// A simple test route
app.get('/', (req, res) => {
  res.send('AfroAsiaConnect Backend is running!');
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/leads', leadRoutes); 
app.use('/api/subscriptions', subscriptionRoutes); 
app.use('/api/notifications', notificationRoutes);
app.use('/api/events', eventRoutes);

// Global error handlers - place them before app.listen
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception thrown:', error);
  // Application specific logging, shutdown, or other logic here
  // It's generally recommended to gracefully shut down the server on an uncaught exception
  process.exit(1); // Exiting after an uncaught exception is often a good practice
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app; // Export for potential testing
