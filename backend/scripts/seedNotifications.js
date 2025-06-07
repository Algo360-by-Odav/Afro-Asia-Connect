const { pool } = require('../config/db');

const seedNotifications = async (targetUserId) => {
  const notificationsData = [
    {
      user_id: targetUserId,
      type: 'success',
      message: 'Your business listing "GreenTech Innovations" has been approved and is now live!',
      link: '/dashboard/my-listings/123',
    },
    {
      user_id: targetUserId,
      type: 'info',
      message: 'You have a new message from "Global Importers Inc." regarding your coffee bean listing.',
      link: '/dashboard/messages/456',
    },
    {
      user_id: targetUserId,
      type: 'warning',
      message: 'Your subscription is expiring in 7 days. Please renew to avoid service interruption.',
      link: '/dashboard/subscription',
    },
    {
      user_id: targetUserId,
      type: 'info',
      message: 'Welcome to AfroAsiaConnect! Complete your profile to get started.',
      link: '/dashboard/profile',
      is_read: true, // Example of an already read notification
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
    },
    {
        user_id: targetUserId,
        type: 'error',
        message: 'Failed to process payment for your last ad campaign. Please update your payment method.',
        link: '/dashboard/billing',
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
    }
  ];

  try {
    // Check if the user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [targetUserId]);
    if (userCheck.rows.length === 0) {
      console.error(`Error: User with ID ${targetUserId} not found. Cannot seed notifications.`);
      return;
    }
    console.log(`User ${targetUserId} found. Proceeding to seed notifications.`);

    for (const notification of notificationsData) {
      const { user_id, type, message, link, is_read = false, created_at } = notification;
      const queryText = `
        INSERT INTO notifications (user_id, type, message, link, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id;
      `;
      const values = [user_id, type, message, link, is_read, created_at || new Date()];
      const res = await pool.query(queryText, values);
      console.log(`Inserted notification with ID: ${res.rows[0].id} for user_id: ${user_id}`);
    }
    console.log(`Successfully seeded ${notificationsData.length} notifications for user_id: ${targetUserId}.`);
  } catch (err) {
    console.error('Error seeding notifications:', err.stack);
  } 
};

// If running this script directly:
if (require.main === module) {
  const targetUserId = process.argv[2] ? parseInt(process.argv[2], 10) : 1; // Default to user_id 1 if no arg
  
  if (isNaN(targetUserId)) {
    console.error('Invalid user_id provided. Please provide a number.');
    pool.end();
  } else {
    console.log(`Attempting to seed notifications for user_id: ${targetUserId}...`);
    seedNotifications(targetUserId).then(() => {
      console.log('Notification seeding script finished.');
      pool.end().then(() => console.log('Database connection pool closed.'));
    }).catch(err => {
      console.error('Script execution failed:', err);
      pool.end().then(() => console.log('Database connection pool closed after script failure.'));
    });
  }
}

module.exports = seedNotifications;
