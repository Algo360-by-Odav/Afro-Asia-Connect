// Test suite for Listings API
const request = require('supertest');
const express = require('express');
const listingsRouter = require('./listings'); 
const authMiddleware = require('../middleware/authMiddleware');

// Mock the authMiddleware to bypass actual authentication for most tests
jest.mock('../middleware/authMiddleware', () => jest.fn((req, res, next) => {
  req.user = { id: 'test-user-id', user_type: 'seller' }; 
  next();
}));

// Mock the database module
const mockQuery = jest.fn();
jest.mock('../config/db', () => ({
  query: mockQuery,
  // Mock pool.connect if your app uses it directly, though typically not needed if only router is tested
  // connect: jest.fn().mockResolvedValue({ query: mockQuery, release: jest.fn() })
}));

const app = express();
app.use(express.json()); // Ensure app can parse JSON body
app.use('/api/listings', listingsRouter);

describe('Listings API', () => {
  beforeEach(() => {
    // Clear all instances and calls to constructor and all methods: 
    mockQuery.mockClear();
    // Ensure the mock implementation is reset if it was changed in a test
    jest.mock('../middleware/authMiddleware', () => jest.fn((req, res, next) => {
      req.user = { id: 'test-user-id', user_type: 'seller' }; 
      next();
    }));
  });

  describe('GET /api/listings/:id', () => {
    it('should return a 404 if listing not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); 
      const response = await request(app).get('/api/listings/nonexistentid');
      expect(response.statusCode).toBe(404);
      expect(response.body.msg).toContain('Listing not found');
    });

    it('should return a listing if found, including new fields', async () => {
      const mockListing = {
        id: '123',
        business_name: 'Test Business',
        business_category: 'Tech',
        description: 'A test business description.',
        country_of_origin: 'Testland',
        target_markets: ['Global'],
        contact_email: 'test@example.com',
        contact_phone: '1234567890',
        website_url: 'http://example.com',
        logo_image_url: 'http://example.com/logo.png',
        gallery_image_urls: ['http://example.com/img1.png'],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user-id',
        subsector: 'Software',
        languages_spoken: ['English', 'Testish'],
        is_verified: true,
        products_info: [{ name: 'Test Product', images: [], specifications: 'Specs', moq: '10' }]
      };
      mockQuery.mockResolvedValueOnce({ rows: [mockListing] });

      const response = await request(app).get('/api/listings/123');
      
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockListing);
      expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM business_listings WHERE id = $1'), ['123']);
    });

    it('should return 500 if database error occurs', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB error'));
      const response = await request(app).get('/api/listings/123');
      expect(response.statusCode).toBe(500);
      expect(response.body.msg).toContain('Server error');
    });
  });


  describe('POST /api/listings', () => {
    const newListingData = {
      business_name: 'New Test Biz',
      business_category: 'Retail',
      description: 'A brand new test business.',
      country_of_origin: 'Newland',
      target_markets: ['Local', 'Online'],
      contact_email: 'newbiz@example.com',
      contact_phone: '0987654321',
      website_url: 'http://newbiz.example.com',
      logo_image_url: 'http://newbiz.example.com/logo.png',
      gallery_image_urls: ['http://newbiz.example.com/img1.png'],
      // New fields
      subsector: 'Online Retail',
      languages_spoken: ['English', 'Newlandish'],
      is_verified: false,
      products_info: JSON.stringify([{ name: 'New Product', images: [], specifications: 'New Specs', moq: '5' }]) // products_info is expected as JSON string by backend
    };

    it('should create a new listing and return it, including new fields', async () => {
      const expectedCreatedListing = {
        id: 'new-id-123', // Simulate DB returning an ID
        ...newListingData,
        products_info: JSON.parse(newListingData.products_info), // Backend returns it parsed
        user_id: 'test-user-id', // from mock authMiddleware
        is_active: true, // Default value from DB or backend logic
        created_at: new Date().toISOString(), // Simulate DB timestamp
        updated_at: new Date().toISOString()  // Simulate DB timestamp
      };
      // Mock the DB query for INSERT
      // The actual query in listings.js returns the newly created row using 'RETURNING *'
      mockQuery.mockResolvedValueOnce({ rows: [expectedCreatedListing] });

      const response = await request(app)
        .post('/api/listings')
        .send(newListingData);

      expect(response.statusCode).toBe(201);
      // Compare relevant fields, as timestamps might differ slightly
      expect(response.body).toMatchObject({
        ...newListingData,
        products_info: JSON.parse(newListingData.products_info),
        user_id: 'test-user-id',
        is_active: true,
      });
      expect(response.body.id).toBe('new-id-123');
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO business_listings'),
        expect.arrayContaining([
          'test-user-id', // user_id from mock auth
          newListingData.business_name,
          newListingData.business_category,
          newListingData.description,
          newListingData.country_of_origin,
          newListingData.target_markets,
          newListingData.contact_email,
          newListingData.contact_phone,
          newListingData.website_url,
          newListingData.logo_image_url,
          newListingData.gallery_image_urls,
          newListingData.subsector,
          newListingData.languages_spoken,
          newListingData.is_verified,
          newListingData.products_info // Sent as JSON string
        ])
      );
    });

    it('should return 401 if user is not authenticated (actual middleware test)', async () => {
      // Override the global mock for this specific test
      jest.mock('../middleware/authMiddleware', () => jest.fn((req, res, next) => {
        // Simulate no authenticated user
        return res.status(401).json({ msg: 'No token, authorization denied' });
      }));
      // Re-require the router to use the new mock for this test scope if needed, or ensure app is re-initialized
      // For simplicity, we assume the mock is picked up. A more robust way would be to re-init app or router.
      const tempApp = express();
      tempApp.use(express.json());
      const freshListingsRouter = require('./listings'); // Re-require to get fresh middleware application
      tempApp.use('/api/listings', freshListingsRouter);

      const response = await request(tempApp)
        .post('/api/listings')
        .send(newListingData);
      expect(response.statusCode).toBe(401);
    });

    it('should return 500 if database error occurs during creation', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB insert error'));
      const response = await request(app)
        .post('/api/listings')
        .send(newListingData);
      expect(response.statusCode).toBe(500);
      expect(response.body.msg).toContain('Server error');
    });
  });


  describe('PUT /api/listings/:id', () => {
    const existingListingId = 'existing-id-456';
    const updateData = {
      business_name: 'Updated Test Biz',
      business_category: 'Services',
      description: 'An updated test business description.',
      subsector: 'Consulting',
      languages_spoken: ['English', 'Updatedish'],
      is_verified: true,
      products_info: JSON.stringify([{ name: 'Updated Product', images: ['newimage.png'], specifications: 'Updated Specs', moq: '20' }])
    };

    it('should update an existing listing and return it, including new fields', async () => {
      const mockUpdatedListing = {
        id: existingListingId,
        ...updateData,
        products_info: JSON.parse(updateData.products_info),
        user_id: 'test-user-id', // Assuming the original listing belonged to this user
        // Other fields like created_at, country_of_origin etc. would remain or be fetched
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      };
      // Mock DB query for UPDATE: first SELECT to check ownership (if implemented, mock it), then UPDATE
      // For simplicity, assuming auth middleware handles ownership or it's checked before DB update in route
      // The route currently returns the updated listing using 'RETURNING *'
      mockQuery.mockResolvedValueOnce({ rows: [mockUpdatedListing] }); // Mock for RETURNING *

      const response = await request(app)
        .put(`/api/listings/${existingListingId}`)
        .send(updateData);

      expect(response.statusCode).toBe(200);
      expect(response.body).toMatchObject({
        id: existingListingId,
        ...updateData,
        products_info: JSON.parse(updateData.products_info),
        user_id: 'test-user-id'
      });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE business_listings SET'),
        expect.arrayContaining([
          updateData.business_name,
          updateData.business_category,
          updateData.description,
          updateData.subsector,
          updateData.languages_spoken,
          updateData.is_verified,
          updateData.products_info, // Sent as JSON string
          existingListingId,
          'test-user-id' // For WHERE id = $N AND user_id = $M
        ])
      );
    });

    it('should return 404 if listing to update is not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] }); // Simulate DB not finding the row to update
      const response = await request(app)
        .put('/api/listings/nonexistentid999')
        .send(updateData);
      expect(response.statusCode).toBe(404);
      expect(response.body.msg).toContain('Listing not found or user not authorized'); // Current msg in route
    });

    it('should return 401 if user is not authenticated (actual middleware test)', async () => {
      jest.mock('../middleware/authMiddleware', () => jest.fn((req, res, next) => {
        return res.status(401).json({ msg: 'No token, authorization denied' });
      }));
      const tempApp = express(); // Re-initialize app with new mock for this test
      tempApp.use(express.json());
      const freshListingsRouter = require('./listings');
      tempApp.use('/api/listings', freshListingsRouter);

      const response = await request(tempApp)
        .put(`/api/listings/${existingListingId}`)
        .send(updateData);
      expect(response.statusCode).toBe(401);
    });

    it('should return 500 if database error occurs during update', async () => {
      mockQuery.mockRejectedValueOnce(new Error('DB update error'));
      const response = await request(app)
        .put(`/api/listings/${existingListingId}`)
        .send(updateData);
      expect(response.statusCode).toBe(500);
      expect(response.body.msg).toContain('Server error');
    });
  });

  // TODO: Add tests for DELETE /api/listings/:id

});
