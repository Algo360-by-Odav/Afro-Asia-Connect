const { pool } = require('../config/db');

const createNotificationsTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      link VARCHAR(255),
      is_read BOOLEAN DEFAULT FALSE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read ON notifications(user_id, is_read);
  `;

  try {
    await pool.query(queryText);
    console.log('"notifications" table and indexes created successfully or already exist.');
  } catch (err) {
    console.error('Error creating "notifications" table:', err.stack);
  } finally {
    // It's generally better to manage pool connections at the application level
    // or when the script's specific task is fully complete.
    // For a standalone script, ending the pool here is okay.
    // await pool.end(); 
    // console.log('Database connection pool potentially closed by script.');
  }
};

// If running this script directly:
if (require.main === module) {
  createNotificationsTable().then(() => {
    console.log('Notification table creation script finished.');
    // Explicitly close the pool if the script is run standalone and completes its task.
    pool.end().then(() => console.log('Database connection pool closed after script execution.'));
  }).catch(err => {
    console.error('Script execution failed:', err);
    pool.end().then(() => console.log('Database connection pool closed after script failure.'));
  });
}

module.exports = createNotificationsTable;
