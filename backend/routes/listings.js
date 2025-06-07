const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware'); 

// @route   GET /api/listings
// @desc    Get all active business listings (add pagination later)
// @access  Public
router.get('/', async (req, res) => {
  console.log('CORRECT GET /api/listings route is being executed NOW!'); // New distinct log
  try {
    // For now, fetch all active listings. Implement pagination and filtering later.
    const listings = await db.query('SELECT * FROM business_listings WHERE is_active = TRUE ORDER BY created_at DESC');
    res.json(listings.rows);
  } catch (err) {
    console.error('Error fetching listings:', err.message);
    res.status(500).json({ msg: 'Server error while fetching listings.', error: err.message });
  }
});

// @route   GET /api/listings/my-listings
// @desc    Get all listings for the authenticated user
// @access  Private
router.get('/my-listings', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;
    const category = req.query.category;

    // Sorting parameters
    const sortBy = req.query.sortBy || 'created_at'; // Default sort column
    const sortOrder = (req.query.sortOrder || 'DESC').toUpperCase(); // Default sort order

    // Whitelist for sortBy columns and sortOrder values to prevent SQL injection
    const validSortBy = ['created_at', 'business_name', 'updated_at'];
    const validSortOrder = ['ASC', 'DESC'];

    if (!validSortBy.includes(sortBy) || !validSortOrder.includes(sortOrder)) {
      return res.status(400).json({ msg: 'Invalid sort parameters.' });
    }

    let listingsQuery = 'SELECT * FROM business_listings WHERE user_id = $1';
    let countQuery = 'SELECT COUNT(*) FROM business_listings WHERE user_id = $1';
    const queryParams = [userId];
    let paramIndex = 2;

    if (category) {
      listingsQuery += ` AND business_category = $${paramIndex}`;
      countQuery += ` AND business_category = $${paramIndex}`;
      queryParams.push(category);
      paramIndex++;
    }

    // Add ORDER BY, LIMIT, and OFFSET
    // Note: sortBy and sortOrder are validated and whitelisted, so direct concatenation is safe here.
    listingsQuery += ` ORDER BY ${sortBy} ${sortOrder} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    queryParams.push(limit, offset);

    // Query to get paginated listings
    const listingsResult = await db.query(listingsQuery, queryParams);

    // Query to get total count of listings for the user (with filter)
    // Remove limit and offset from queryParams for count query
    const countQueryParams = [userId];
    if (category) {
      countQueryParams.push(category);
    }
    const totalCountResult = await db.query(countQuery, countQueryParams);

    const totalCount = parseInt(totalCountResult.rows[0].count, 10);

    res.json({
      listings: listingsResult.rows,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error('Error fetching user listings:', err.message);
    res.status(500).json({ msg: 'Server error while fetching your listings.', error: err.message });
  }
});


// Get listing statistics for the authenticated user
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const statsResult = await db.query(
      `SELECT 
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_count
      FROM business_listings WHERE user_id = $1`,
      [userId]
    );

    const stats = {
      activeCount: parseInt(statsResult.rows[0].active_count, 10) || 0,
      inactiveCount: parseInt(statsResult.rows[0].inactive_count, 10) || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching listing stats:', error);
    res.status(500).json({ msg: 'Server error while fetching listing statistics.' });
  }
});

// @route   GET /api/listings/:id
// @desc    Get a single business listing by ID
// @access  Public
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const listing = await db.query('SELECT * FROM business_listings WHERE id = $1 AND is_active = TRUE', [id]);
    if (listing.rows.length === 0) {
      return res.status(404).json({ msg: 'Listing not found or not active.' });
    }
    res.json(listing.rows[0]);
  } catch (err) {
    console.error(`Error fetching listing ${id}:`, err.message);
    // Check for invalid UUID format or other specific DB errors if needed
    if (err.message.includes('invalid input syntax for type integer')) { // Or 'uuid' if your ID is UUID
        return res.status(400).json({ msg: 'Invalid listing ID format.' });
    }
    res.status(500).json({ msg: 'Server error while fetching listing.', error: err.message });
  }
});

// @route   POST /api/listings
// @desc    Create a new business listing
// @access  Private (requires authentication, only sellers)
router.post('/', authMiddleware, async (req, res) => {
  const { 
    business_name,
    business_category,
    description,
    country_of_origin,
    target_markets, // Expected as an array e.g., ['Asia', 'Africa']
    contact_email,
    contact_phone,
    website_url,
    logo_image_url,
    gallery_image_urls, // Expected as an array e.g., ['/path/to/img1.jpg', '/path/to/img2.jpg']
    subsector,
    languages_spoken, // Expected as an array e.g., ['English', 'Swahili']
    is_verified, // Boolean, defaults to false in DB if not provided
    products_info // Expected as JSON array of objects, e.g., [{name, images, specs, moq}]
  } = req.body;

  const user_id = req.user.id; // From authMiddleware

  // Basic validation
  if (!business_name || !business_category || !contact_email) {
    return res.status(400).json({ msg: 'Please provide business name, category, and contact email.' });
  }
  
  console.log('--- DEBUG: req.user in POST /api/listings:', JSON.stringify(req.user, null, 2));
  console.log('--- DEBUG: req.user.user_type in POST /api/listings:', req.user.user_type);
  // Ensure user is a seller (optional, based on your user_type logic)
  if (req.user.user_type !== 'seller') {
    return res.status(403).json({ msg: 'Access denied. Only sellers can create listings.' });
  }

  try {
    const newListingQuery = `
      INSERT INTO business_listings 
        (user_id, business_name, business_category, description, country_of_origin, target_markets, contact_email, contact_phone, website_url, logo_image_url, gallery_image_urls, subsector, languages_spoken, is_verified, products_info)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *;
    `;
    const values = [
      req.user.id, 
      business_name, 
      business_category, 
      description, 
      country_of_origin, 
      target_markets || [], // Default to empty array if not provided
      contact_email, 
      contact_phone, 
      website_url, 
      logo_image_url, 
      gallery_image_urls || [], // Default to empty array
      subsector,        // New
      languages_spoken, // New
      is_verified,      // New (ensure default in DB or handle null here)
      products_info     // New (ensure it's valid JSON or null)
    ];

    const result = await db.query(newListingQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating listing:', err.message);
    res.status(500).json({ msg: 'Server error while creating listing.', error: err.message });
  }
});

// @route   PUT /api/listings/:id
// @desc    Update an existing business listing
// @access  Private (requires authentication, only owner can edit)
router.put('/:id', authMiddleware, async (req, res) => {
  const { id: listingId } = req.params;
  const userId = req.user.id;

  try {
    // First, check if the listing exists and if the user owns it
    const existingListingResult = await db.query('SELECT * FROM business_listings WHERE id = $1', [listingId]);
    if (existingListingResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Listing not found.' });
    }

    const listing = existingListingResult.rows[0];
    if (listing.user_id !== userId) {
      return res.status(403).json({ msg: 'Access denied. You do not own this listing.' });
    }
    // Also ensure the user is a seller, though ownership implies this for listings
    if (req.user.user_type !== 'seller') {
      return res.status(403).json({ msg: 'Access denied. Only sellers can modify listings.' });
    }

    const {
      business_name,
      business_category,
      description,
      country_of_origin,
      target_markets,
      contact_email,
      contact_phone,
      website_url,
      logo_image_url,
      gallery_image_urls,
      is_active,
      subsector,
      languages_spoken,
      is_verified,
      products_info
    } = req.body;

    // Dynamically build the update query
    const updateFields = [];
    const values = [];
    let valueCount = 1;

    if (business_name !== undefined) { updateFields.push(`business_name = $${valueCount++}`); values.push(business_name); }
    if (business_category !== undefined) { updateFields.push(`business_category = $${valueCount++}`); values.push(business_category); }
    if (description !== undefined) { updateFields.push(`description = $${valueCount++}`); values.push(description); }
    if (country_of_origin !== undefined) { updateFields.push(`country_of_origin = $${valueCount++}`); values.push(country_of_origin); }
    if (target_markets !== undefined) { updateFields.push(`target_markets = $${valueCount++}`); values.push(target_markets); }
    if (contact_email !== undefined) { updateFields.push(`contact_email = $${valueCount++}`); values.push(contact_email); }
    if (contact_phone !== undefined) { updateFields.push(`contact_phone = $${valueCount++}`); values.push(contact_phone); }
    if (website_url !== undefined) { updateFields.push(`website_url = $${valueCount++}`); values.push(website_url); }
    if (logo_image_url !== undefined) { updateFields.push(`logo_image_url = $${valueCount++}`); values.push(logo_image_url); }
    if (gallery_image_urls !== undefined) { updateFields.push(`gallery_image_urls = $${valueCount++}`); values.push(gallery_image_urls); }
    if (is_active !== undefined) { updateFields.push(`is_active = $${valueCount++}`); values.push(is_active); }

    // Add new fields to update if provided
    if (subsector !== undefined) { updateFields.push(`subsector = $${valueCount++}`); values.push(subsector); }
    if (languages_spoken !== undefined) { updateFields.push(`languages_spoken = $${valueCount++}`); values.push(languages_spoken); } // Expects array
    if (is_verified !== undefined) { updateFields.push(`is_verified = $${valueCount++}`); values.push(is_verified); } // Expects boolean
    if (products_info !== undefined) { updateFields.push(`products_info = $${valueCount++}`); values.push(products_info); } // Expects JSON object/array

    if (updateFields.length === 0) {
      return res.status(400).json({ msg: 'No fields to update provided.' });
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const updateQuery = `
      UPDATE business_listings
      SET ${updateFields.join(', ')}
      WHERE id = $${valueCount++} AND user_id = $${valueCount++}
      RETURNING *;
    `;
    values.push(listingId, userId);

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      // This case should ideally not be hit if previous checks passed, but as a safeguard
      return res.status(404).json({ msg: 'Listing not found or update failed.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating listing:', err.message);
    // Check for specific DB errors if needed, e.g., constraint violations
    if (err.code === '23505') { // Unique constraint violation
        return res.status(409).json({ msg: 'Update failed due to a conflict (e.g., duplicate value for a unique field).', error: err.detail });
    }
    res.status(500).json({ msg: 'Server error while updating listing.', error: err.message });
  }
});

// @route   DELETE /api/listings/:id
// @desc    Delete a business listing
// @access  Private (requires authentication, only owner can delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id: listingId } = req.params;
  const userId = req.user.id;

  try {
    // First, check if the listing exists and if the user owns it
    const existingListingResult = await db.query('SELECT user_id FROM business_listings WHERE id = $1', [listingId]);
    if (existingListingResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Listing not found.' });
    }

    const listing = existingListingResult.rows[0];
    if (listing.user_id !== userId) {
      return res.status(403).json({ msg: 'Access denied. You do not own this listing.' });
    }

    // Ensure user is a seller
    if (req.user.user_type !== 'seller') {
      return res.status(403).json({ msg: 'Access denied. Only sellers can delete listings.' });
    }

    // Perform the delete operation
    const deleteResult = await db.query('DELETE FROM business_listings WHERE id = $1 AND user_id = $2 RETURNING id', [listingId, userId]);

    if (deleteResult.rowCount === 0) {
      // This might happen if the listing was deleted by another request between the check and this operation,
      // or if the user_id check within the DELETE query itself fails (though redundant due to prior checks).
      return res.status(404).json({ msg: 'Listing not found or delete operation failed unexpectedly.' });
    }

    res.json({ msg: 'Listing deleted successfully.', deletedListingId: deleteResult.rows[0].id });

  } catch (err) {
    console.error('Error deleting listing:', err.message);
    res.status(500).json({ msg: 'Server error while deleting listing.', error: err.message });
  }
});

module.exports = router;
