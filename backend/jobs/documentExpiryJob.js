const cron = require('node-cron');
const prisma = require('../prismaClient');

// Run daily at 9 AM
const documentExpiryJob = cron.schedule('0 9 * * *', async () => {
  console.log('[DocumentExpiryJob] Checking for expiring documents...');
  
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

    // Find documents expiring in 30, 7, or 1 days
    const expiringDocs = await prisma.document.findMany({
      where: {
        expiry: {
          gte: now,
          lte: in30Days,
        },
      },
      include: { owner: true },
    });

    for (const doc of expiringDocs) {
      const daysUntilExpiry = Math.ceil((doc.expiry - now) / (1000 * 60 * 60 * 24));
      
      // Only send reminders for 30, 7, and 1 day marks
      if ([30, 7, 1].includes(daysUntilExpiry)) {
        // Check if we already sent this reminder
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: doc.ownerId,
            type: 'DOCUMENT_EXPIRY',
            message: { contains: `${doc.title}` },
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              userId: doc.ownerId,
              type: 'DOCUMENT_EXPIRY',
              message: `Document "${doc.title}" expires in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
              isRead: false,
            },
          });
          console.log(`[DocumentExpiryJob] Reminder sent for ${doc.title} (${daysUntilExpiry} days)`);
        }
      }
    }
  } catch (error) {
    console.error('[DocumentExpiryJob] Error:', error);
  }
}, {
  scheduled: false, // Don't start automatically
});

module.exports = {
  start: () => {
    documentExpiryJob.start();
    console.log('[DocumentExpiryJob] Started - runs daily at 9 AM');
  },
  stop: () => {
    documentExpiryJob.stop();
  },
};
