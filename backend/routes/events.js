const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Your database connection module
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// === Public Routes ===

// GET all published events
// GET /api/events
router.get('/', async (req, res) => {
  try {
    const query = 'SELECT * FROM events WHERE is_published = TRUE ORDER BY event_date DESC';
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching published events:', err.message);
    res.status(500).json({ msg: 'SERVER_ERROR: Could not fetch events.' });
  }
});

// GET a single event by ID (if published)
// GET /api/events/:id
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ msg: 'BAD_REQUEST: Invalid event ID format.' });
  }
  try {
    // Attempt to fetch if published OR if user is admin (admin check comes later if needed for unpublished)
    // For now, let's keep it simple: public can only see published events directly by ID.
    // Admins will use a separate route or have logic in /all to see unpublished.
    const query = 'SELECT * FROM events WHERE id = $1 AND is_published = TRUE';
    const { rows } = await db.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ msg: 'NOT_FOUND: Event not found or not published.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error fetching event ${id}:`, err.message);
    res.status(500).json({ msg: 'SERVER_ERROR: Could not fetch event.' });
  }
});

// === Admin Routes ===

// POST create a new event
// POST /api/events
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { title, event_date, location, description, image_url, registration_link, is_published = false } = req.body;
  const user_id = req.user.id; // From authMiddleware

  if (!title || !event_date) {
    return res.status(400).json({ msg: 'VALIDATION_ERROR: Title and event date are required.' });
  }

  try {
    const query = `
      INSERT INTO events (title, event_date, location, description, image_url, registration_link, is_published, user_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [title, event_date, location, description, image_url, registration_link, is_published, user_id];
    const { rows } = await db.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating event:', err.message);
    if (err.message.includes('is_admin')) { // More specific error if possible
        return res.status(403).json({ msg: 'FORBIDDEN: User does not have admin privileges.' });
    }
    res.status(500).json({ msg: 'SERVER_ERROR: Could not create event.' });
  }
});

// GET all events (published and unpublished) - For Admin
// GET /api/events/all
router.get('/all/list', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const query = 'SELECT e.*, u.email as user_email FROM events e LEFT JOIN users u ON e.user_id = u.id ORDER BY e.event_date DESC';
    const { rows } = await db.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching all events for admin:', err.message);
    res.status(500).json({ msg: 'SERVER_ERROR: Could not fetch all events.' });
  }
});

// GET a single event by ID (published or unpublished) - For Admin
// This route allows admin to fetch any event by ID, overriding the public one if needed for unpublished events.
// We can refine this. For now, the public GET /:id only gets published. Admin can use GET /all/list and then manage.
// Or, we can modify GET /:id to check if user is admin if event is not published.
// Let's modify GET /:id to be smarter:

// (Revisiting GET /:id - making it smarter for admins)
// This route is already defined above. We will modify it to allow admins to see unpublished events.
// This requires a more complex logic, so for now, we'll keep GET /:id public-only for published.
// Admins can use /all/list and then manage specific events through PUT/DELETE /:id


// PUT update an event by ID
// PUT /api/events/:id
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ msg: 'BAD_REQUEST: Invalid event ID format.' });
  }
  const { title, event_date, location, description, image_url, registration_link, is_published } = req.body;
  // const admin_user_id = req.user.id; // For ownership check if needed later

  if (!title || !event_date) {
    return res.status(400).json({ msg: 'VALIDATION_ERROR: Title and event date are required.' });
  }

  try {
    // First, check if the event exists
    const checkQuery = 'SELECT * FROM events WHERE id = $1';
    const { rows: existingEvents } = await db.query(checkQuery, [id]);
    if (existingEvents.length === 0) {
      return res.status(404).json({ msg: 'NOT_FOUND: Event not found.' });
    }

    // Optional: Add ownership check here if admins can only edit their own events.
    // if (existingEvents[0].user_id !== admin_user_id) {
    //   return res.status(403).json({ msg: 'FORBIDDEN: You do not own this event.' });
    // }

    const updateQuery = `
      UPDATE events
      SET title = $1, event_date = $2, location = $3, description = $4, 
          image_url = $5, registration_link = $6, is_published = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *;
    `;
    const values = [title, event_date, location, description, image_url, registration_link, is_published, id];
    const { rows } = await db.query(updateQuery, values);
    res.json(rows[0]);
  } catch (err) {
    console.error(`Error updating event ${id}:`, err.message);
    res.status(500).json({ msg: 'SERVER_ERROR: Could not update event.' });
  }
});

// DELETE an event by ID
// DELETE /api/events/:id
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { id } = req.params;
  if (isNaN(parseInt(id))) {
    return res.status(400).json({ msg: 'BAD_REQUEST: Invalid event ID format.' });
  }
  // const admin_user_id = req.user.id; // For ownership check if needed later

  try {
    // First, check if the event exists
    const checkQuery = 'SELECT * FROM events WHERE id = $1';
    const { rows: existingEvents } = await db.query(checkQuery, [id]);
    if (existingEvents.length === 0) {
      return res.status(404).json({ msg: 'NOT_FOUND: Event not found.' });
    }

    // Optional: Add ownership check here.
    // if (existingEvents[0].user_id !== admin_user_id) {
    //   return res.status(403).json({ msg: 'FORBIDDEN: You do not own this event.' });
    // }

    const deleteQuery = 'DELETE FROM events WHERE id = $1 RETURNING *;';
    const { rows } = await db.query(deleteQuery, [id]);
    res.json({ msg: 'SUCCESS: Event deleted successfully.', deletedEvent: rows[0] });
  } catch (err) {
    console.error(`Error deleting event ${id}:`, err.message);
    res.status(500).json({ msg: 'SERVER_ERROR: Could not delete event.' });
  }
});

module.exports = router;
