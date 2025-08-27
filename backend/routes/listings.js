const express = require('express');
const router = express.Router();
const listingService = require('../services/listingService');
const authMiddleware = require('../middleware/authMiddleware'); 

// @route   GET /api/listings
// @desc    Get all active business listings (add pagination later)
// @access  Public
router.get('/', async (req, res) => {
    try {
    const listings = await listingService.listActive();
    res.json(listings);
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
    const category = req.query.category;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = (req.query.sortOrder || 'desc').toLowerCase();

    // Basic validation for sortBy and sortOrder (prisma fields)
    const validSortBy = ['createdAt', 'businessName', 'updatedAt'];
    const validSortOrder = ['asc', 'desc'];
    if (!validSortBy.includes(sortBy) || !validSortOrder.includes(sortOrder)) {
      return res.status(400).json({ msg: 'Invalid sort parameters.' });
    }

    const [listings, totalCount] = await Promise.all([
      listingService.listForUser(userId, { page, limit, category, sortBy, sortOrder }),
      listingService.countForUser(userId, category),
    ]);

    res.json({
      listings,
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
    const stats = await listingService.statsForUser(userId);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching listing stats:', error);
    res.status(500).json({ msg: 'Server error while fetching listing statistics.' });
  }
});



// @route   POST /api/listings
// @desc    Create a new business listing
// @access  Private (requires authentication, only sellers)
router.post('/', authMiddleware, async (req, res) => {
  console.log('POST /api/listings - Request body:', req.body);
  console.log('POST /api/listings - User:', req.user);
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
    subsector,
    languages_spoken,
    is_verified,
    products_info,
    is_active,
  } = req.body;

  // ensure seller - check both user_type and role fields for compatibility - prioritize role field
  const userRole = req.user.role || req.user.user_type;
  console.log('POST /api/listings - User role check:', { userRole, fullUser: req.user });
  
  // Check for all possible seller role variations (case insensitive)
  const normalizedRole = userRole ? userRole.toString().toUpperCase() : '';
  const isSellerRole = normalizedRole === 'SELLER' || normalizedRole === 'SUPPLIER' || normalizedRole === 'SERVICE_PROVIDER';
  
  if (!isSellerRole) {
    console.log('Access denied - Role check failed:', { userRole, normalizedRole, isSellerRole });
    return res.status(403).json({ 
      msg: 'Access denied. You must be a seller to manage listings.', 
      currentRole: userRole,
      normalizedRole: normalizedRole,
      debug: req.user 
    });
  }
  if (!business_name || !business_category || !description || !country_of_origin) {
    return res.status(400).json({ msg: 'VALIDATION_ERROR: Missing required fields.' });
  }

  const data = {
    businessName: business_name,
    businessCategory: business_category,
    description,
    countryOfOrigin: country_of_origin,
    targetMarkets: target_markets || [],
    contactEmail: contact_email,
    contactPhone: contact_phone,
    websiteUrl: website_url,
    logoImageUrl: logo_image_url,
    galleryImageUrls: gallery_image_urls,
    subsector,
    languagesSpoken: languages_spoken,
    isVerified: is_verified,
    productsInfo: products_info,
    isActive: is_active,
  };

  try {
    const created = await listingService.create(req.user.id, data);
    res.status(201).json(created);
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ msg: 'Server error while creating listing.' });
  }
});

/*
  console.log('Received POST /api/listings request body:', req.body); // legacy debug
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

  // Basic validation for required fields
  console.log('DEBUG: Checking required fields. BN:', business_name, 'BC:', business_category, 'D:', description, 'COO:', country_of_origin);
  if (!business_name || !business_category || !description || !country_of_origin) {
    console.error('DEBUG: Required fields validation failed. Sending 400.');
    return res.status(400).json({ msg: 'VALIDATION_ERROR: Please provide all required fields (business_name, business_category, description, country_of_origin).' });
  }
  
  console.log('--- DEBUG: req.user in POST /api/listings:', JSON.stringify(req.user, null, 2));
  console.log('--- DEBUG: req.user.user_type in POST /api/listings:', req.user.user_type);
  // Ensure user is a seller (optional, based on your user_type logic)
  if (req.user.user_type !== 'seller') {
    return res.status(403).json({ msg: 'Access denied. Only sellers can create listings.' });
  }

  try {
    // legacy SQL removed = `
      INSERT INTO business_listings 
        (user_id, business_name, business_category, description, country_of_origin, 
         target_markets, contact_email, contact_phone, website_url, logo_image_url, gallery_image_urls,
         is_active)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE)
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
      gallery_image_urls || null // Default to null if not provided (consider if DB expects array or can handle null) or null)
    ];

    const result = await db.query(newListingQuery, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating listing:', err.message);
    res.status(500).json({ msg: 'Server error while creating listing.', error: err.message });
  }
*/

// (Legacy raw SQL PUT/DELETE block removed)
/*

// @desc    Update an existing business listing
// @access  Private (requires authentication, only owner can edit)



  // legacy SQL block removed

    // legacy code removed = await db.query('SELECT * FROM business_listings WHERE id = $1', [listingId]);
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


*/
// @route   GET api/listings/:id
// @desc    Get a single business listing by ID
// @access  Public (or Private if you want to restrict who can view listings)
router.get('/:id', async (req, res) => {
  try {
    const listingId = parseInt(req.params.id, 10);
    if (isNaN(listingId)) {
      return res.status(400).json({ msg: 'Invalid listing ID format.' });
    }

    const listing = await listingService.getById(listingId);

    if (!listing) {
      return res.status(404).json({ msg: 'Listing not found.' });
    }

    res.json(listing);
  } catch (err) {
    console.error('Error fetching listing by ID:', err.message);
    res.status(500).json({ msg: 'Server error while fetching listing.' });
  }
});


// @route   PUT api/listings/:id
// @desc    Update an existing business listing
// @access  Private (only owner or admin should update)
/*
  if (isNaN(listingId)) {
    return res.status(400).json({ msg: 'Invalid listing ID format.' });
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
    is_active // Allow updating is_active status if needed
    // Add any other fields that can be updated
  } = req.body;

  const userId = req.user.id;

  // Basic validation for required fields that are being updated
  if (!business_name || !business_category || !description || !country_of_origin) {
    return res.status(400).json({ msg: 'VALIDATION_ERROR: Business name, category, description, and country of origin are required.' });

  try {
    // First, verify the listing exists and the user owns it (or is an admin)
    const verifyQuery = 'SELECT user_id FROM business_listings WHERE id = $1';
    const verifyResult = await db.query(verifyQuery, [listingId]);

    if (verifyResult.rows.length === 0) {
      return res.status(404).json({ msg: 'Listing not found.' });
    }

    // Authorization check: user must be the owner of the listing
    // You might want to allow admins to edit any listing too
    if (verifyResult.rows[0].user_id !== userId) {
      return res.status(403).json({ msg: 'User not authorized to update this listing.' });
    }

    // Construct the SET part of the UPDATE query dynamically based on provided fields
    // For simplicity, this example updates all fields sent in the body.
    // A more robust solution would build the SET clause based on which fields are actually present in req.body.
    const updateQuery = `
      UPDATE business_listings
      SET 
        business_name = $1,
        business_category = $2,
        description = $3,
        country_of_origin = $4,
        target_markets = $5,
        contact_email = $6,
        contact_phone = $7,
        website_url = $8,
        logo_image_url = $9,
        gallery_image_urls = $10,
        is_active = $11,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12 AND user_id = $13
      RETURNING *;
    `;

    const values = [
      business_name,
      business_category,
      description,
      country_of_origin,
      target_markets || null,
      contact_email || null,
      contact_phone || null,
      website_url || null,
      logo_image_url || null,
      gallery_image_urls || null,
      typeof is_active === 'boolean' ? is_active : true, // Default to true if not specified or invalid
      listingId,
      userId
    ];

    const result = await db.query(updateQuery, values);

    if (result.rows.length === 0) {
      // This case should ideally not be hit if the initial verification and user_id check in WHERE clause are correct
      return res.status(404).json({ msg: 'Listing not found or user mismatch during update.' }); 
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating listing:', err.message);
    // Check for specific PostgreSQL errors if needed, e.g., err.code
    res.status(500).json({ msg: 'Server error while updating listing.', error: err.message });
  }
*/
// @route   GET /api/listings/:id
// @desc    Get a single business listing by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const listingId = parseInt(req.params.id, 10);
    if (isNaN(listingId)) return res.status(400).json({ msg: 'Invalid listing ID.' });
    const listing = await listingService.getById(listingId);
    if (!listing) return res.status(404).json({ msg: 'Listing not found.' });
    res.json(listing);
  } catch (err) {
    console.error('Error fetching listing by ID:', err);
    res.status(500).json({ msg: 'Server error while fetching listing.' });
  }
});

// ------------------ Prisma-based Update & Delete ------------------
router.put('/:id', authMiddleware, async (req, res) => {
  console.log('PUT /api/listings/:id - User:', req.user);
  const listingId = Number(req.params.id);
  if (Number.isNaN(listingId)) return res.status(400).json({ msg: 'Invalid listing ID.' });
  // Check both user_type and role fields for compatibility - prioritize role field
  const userRole = req.user.role || req.user.user_type;
  const isSellerRole = userRole === 'seller' || userRole === 'SUPPLIER';
  console.log('PUT /api/listings/:id - userRole:', userRole, 'isSellerRole:', isSellerRole);
  if (!isSellerRole) return res.status(403).json({ msg: 'Only sellers can update listings.', currentRole: userRole });
  try {
    // Transform snake_case fields to camelCase for Prisma
    const transformedData = {};
    if (req.body.business_name !== undefined) transformedData.businessName = req.body.business_name;
    if (req.body.business_category !== undefined) transformedData.businessCategory = req.body.business_category;
    if (req.body.description !== undefined) transformedData.description = req.body.description;
    if (req.body.country_of_origin !== undefined) transformedData.countryOfOrigin = req.body.country_of_origin;
    if (req.body.target_markets !== undefined) transformedData.targetMarkets = req.body.target_markets;
    if (req.body.contact_email !== undefined) transformedData.contactEmail = req.body.contact_email;
    if (req.body.contact_phone !== undefined) transformedData.contactPhone = req.body.contact_phone;
    if (req.body.website_url !== undefined) transformedData.websiteUrl = req.body.website_url;
    if (req.body.logo_image_url !== undefined) transformedData.logoImageUrl = req.body.logo_image_url;
    if (req.body.gallery_image_urls !== undefined) transformedData.galleryImageUrls = req.body.gallery_image_urls;
    if (req.body.isActive !== undefined) transformedData.isActive = req.body.isActive;
    
    console.log('PUT /api/listings/:id - transformedData:', transformedData);
    const updated = await listingService.update(listingId, req.user.id, transformedData);
    if (!updated) return res.status(404).json({ msg: 'Listing not found.' });
    res.json(updated);
  } catch (e) {
    console.error('Error updating listing:', e);
    console.error('Error stack:', e.stack);
    res.status(500).json({ msg: 'Server error while updating listing.', error: e.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const listingId = Number(req.params.id);
  if (Number.isNaN(listingId)) return res.status(400).json({ msg: 'Invalid listing ID.' });
  // Check both user_type and role fields for compatibility - prioritize role field
  const userRole = req.user.role || req.user.user_type;
  const isSellerRole = userRole === 'seller' || userRole === 'SUPPLIER';
  if (!isSellerRole) return res.status(403).json({ msg: 'Only sellers can delete listings.' });
  try {
    await listingService.remove(listingId, req.user.id);
    res.json({ msg: 'Listing deleted.' });
  } catch (e) {
    console.error('Error deleting listing:', e);
    res.status(404).json({ msg: 'Listing not found.' });
  }
});

module.exports = router;
