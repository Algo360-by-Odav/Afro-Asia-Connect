require('dotenv').config(); // Load environment variables at the very top
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const http = require('http');
const cron = require('node-cron');
const reminderScheduler = require('./services/reminderScheduler');
const authRoutes = require('./routes/auth'); // Import auth routes
const listingRoutes = require('./routes/listings');
const servicesRoutes = require('./routes/services');
const leadRoutes = require('./routes/leads');
const subscriptionRoutes = require('./routes/subscriptions');
const notificationRoutes = require('./routes/notifications');
const eventRoutes = require('./routes/events');
const companyRoutes = require('./routes/companies');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');
const uploadRoutes = require('./routes/upload');
const serviceRequestRoutes = require('./routes/serviceRequests');
const consultationsRoutes = require('./routes/consultations');
const dashboardRoutes = require('./routes/dashboard');
const providersRoutes = require('./routes/providers');
const documentsRoutes = require('./routes/documents');
const documentSharesRoutes = require('./routes/documentShares');
const complianceRoutes = require('./routes/compliance');
const messagingRoutes = require('./routes/messaging');
const messageFilesRoutes = require('./routes/messageFiles');
const messageTemplatesRoutes = require('./routes/messageTemplates');
const scheduledMessagesRoutes = require('./routes/scheduledMessages');
const groupChatsRoutes = require('./routes/groupChats');
const analyticsRoutes = require('./routes/analytics');
const aiRoutes = require('./routes/ai');
const usersRoutes = require('./routes/users');
const securityRoutes = require('./routes/security');
const automationRoutes = require('./routes/automation');
const advancedMessagingRoutes = require('./routes/advancedMessaging');
const adminPanelRoutes = require('./routes/adminPanel');
const marketInsightsRoutes = require('./routes/marketInsights');
const billingRoutes = require('./routes/billing');
const teamRoutes = require('./routes/team');
const reviewsRoutes = require('./routes/reviews');
const bookingsRoutes = require('./routes/bookings');
const emailsRoutes = require('./routes/emails');
const paymentsRoutes = require('./routes/payments');
const smsRoutes = require('./routes/sms');
const reminderJob = require('./jobs/reminderJob');
const documentExpiryJob = require('./jobs/documentExpiryJob');
const { startScheduledMessageJob } = require('./jobs/scheduledMessageJob');
const { initializeSocket } = require('./socket/socketHandler');

const PORT = process.env.PORT || 3001; // Backend server port, now respects .env
const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
console.log('[WebSocket] Socket.IO initialized');

// Middleware to parse JSON bodies and cookies
app.use(cookieParser()); // Middleware to parse cookies
app.use(express.json());
// allow frontend on different port with credentials
app.use(cors({ 
  origin: [
    'http://localhost:3000', 
    'http://127.0.0.1:61259', 
    'http://10.0.2.2:3001',
    'https://afroasia-connect.netlify.app',
    process.env.FRONTEND_URL || 'https://afroasia-connect.netlify.app'
  ],
  credentials: true 
}));

// A simple test route
app.get('/', (req, res) => {
  res.send('AfroAsiaConnect Backend is running!');
});

// Authentication routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/leads', leadRoutes); 
app.use('/api/subscriptions', subscriptionRoutes); 
app.use('/api/notifications', notificationRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/service-requests', serviceRequestRoutes);
app.use('/api/consultations', consultationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/providers', providersRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/document-shares', documentSharesRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/messaging', messagingRoutes);
app.use('/api/message-files', messageFilesRoutes);
app.use('/api/message-templates', messageTemplatesRoutes);
app.use('/api/scheduled-messages', scheduledMessagesRoutes);
app.use('/api/group-chats', groupChatsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/advanced-messaging', advancedMessagingRoutes);
app.use('/api/admin', adminPanelRoutes);
app.use('/api/market-insights', marketInsightsRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files statically

// Start cron jobs
reminderJob.start();
documentExpiryJob.start();
startScheduledMessageJob();
console.log('📅 Cron jobs started');

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

// Start server (production-ready configuration)
// PORT already declared above

if (require.main === module) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AfroAsiaConnect API server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🗄️ Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
    console.log(`📊 Dashboard available at http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server ready`);
    console.log(`⏰ Cron jobs initialized`);
    
    // Start the reminder scheduler
    try {
      reminderScheduler.start();
      console.log(`📧 Email reminder scheduler started`);
    } catch (error) {
      console.error('❌ Failed to start reminder scheduler:', error.message);
    }
  });
}

module.exports = { app, server }; // Export for potential testing
