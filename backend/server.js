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
const premiumNewsRoutes = require('./routes/premiumNews');
const categoriesRoutes = require('./routes/categories');
const billingRoutes = require('./routes/billing');
const teamRoutes = require('./routes/team');
const teamsRoutes = require('./routes/teams'); // New advanced teams API
const profilesRoutes = require('./routes/profiles'); // New advanced profiles API
const reviewsRoutes = require('./routes/reviews');
const bookingsRoutes = require('./routes/bookings');
const emailsRoutes = require('./routes/emails');
const paymentsRoutes = require('./routes/payments');
const smsRoutes = require('./routes/sms');
const adminRoutes = require('./routes/admin');
const verificationRoutes = require('./routes/verification');
const searchRoutes = require('./routes/search');
const i18nRoutes = require('./routes/i18n');
const filesRoutes = require('./routes/files');
const emailNotificationsRoutes = require('./routes/emailNotifications');
const rateLimitMiddleware = require('./middleware/rateLimitMiddleware');
const securityMiddleware = require('./middleware/securityMiddleware');
const reminderJob = require('./jobs/reminderJob');
const documentExpiryJob = require('./jobs/documentExpiryJob');
const { startScheduledMessageJob } = require('./jobs/scheduledMessageJob');
const spotlightRotationJob = require('./jobs/spotlightRotationJob');
const { initializeSocket } = require('./socket/socketHandler');
const notificationService = require('./services/notificationService');

const PORT = process.env.PORT || 3001; // Backend server port, now respects .env
const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);

// Set Socket.IO instance in notification service for real-time notifications
notificationService.setSocketIO(io);

console.log('[WebSocket] Socket.IO initialized');
console.log('🔔 NotificationService integrated with WebSocket');

// Mount auth routes early with CORS and JSON parsing to ensure login/register
// are not blocked by aggressive security middleware
app.use('/auth', cors(securityMiddleware.corsOptions), express.json({ limit: '10mb' }), authRoutes);

// Security middleware setup (applies to all other routes)
app.use(securityMiddleware.securityHeaders);
app.use(cors(securityMiddleware.corsOptions));
app.use(rateLimitMiddleware.generalRateLimit);
app.use(securityMiddleware.requestFingerprinting);
app.use(securityMiddleware.ipFilter);
app.use(securityMiddleware.securityMonitoring);

// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Input sanitization and validation
app.use(securityMiddleware.sanitizeInput);
app.use(securityMiddleware.sqlInjectionProtection);
app.use(securityMiddleware.honeypot);

// A simple test route
app.get('/', (req, res) => {
  res.send('AfroAsiaConnect Backend is running!');
});

// Test auth route accessibility
app.get('/auth/test', (req, res) => {
  res.json({ message: 'Auth route is accessible', timestamp: new Date().toISOString() });
});

// Authentication routes already mounted early
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
app.use('/api/admin', adminRoutes);
app.use('/api/market-insights', marketInsightsRoutes);
app.use('/api/premium-news', premiumNewsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/teams', teamsRoutes); // New advanced teams management API
app.use('/api/profiles', profilesRoutes); // New advanced user profiles API
app.use('/api/reviews', reviewsRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/emails', emailsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/sms', smsRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/i18n', i18nRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/email-notifications', emailNotificationsRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files statically

// Start cron jobs
reminderJob.start();
documentExpiryJob.start();
startScheduledMessageJob();
spotlightRotationJob.start();
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
