// Listings API integration tests (Express router)
// Clean rewrite – mocks service layer, not Prisma. All tests align with actual route behaviour.

const request = require('supertest');
const express = require('express');

// ------- Mock the listing service layer ---------
const mockListingService = {
  listActive: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};
jest.mock('../services/listingService', () => mockListingService);

// ------- Auth middleware mock with toggle ---------
let mockAuthEnabled = true;
jest.mock('../middleware/authMiddleware', () => jest.fn((req, res, next) => {
  if (!mockAuthEnabled) {
    return res.status(401).json({ msg: 'Not authenticated' });
  }
  req.user = { id: 'test-user-id', user_type: 'seller' };
  return next();
}));

// Router under test
const listingsRouter = require('./listings');

// Express app setup
const app = express();
app.use(express.json());
app.use('/api/listings', listingsRouter);

// ------- Test data ---------
const baseListing = {
  id: '123',
  businessName: 'Test Biz',
  businessCategory: 'Tech',
  description: 'Lorem ipsum',
  countryOfOrigin: 'Wonderland',
  targetMarkets: ['Global'],
  contactEmail: 'test@example.com',
  contactPhone: '111111',
  websiteUrl: 'http://example.com',
  logoImageUrl: 'logo.png',
  galleryImageUrls: ['g1.png'],
  subsector: 'Software',
  languagesSpoken: ['English'],
  isActive: true,
  isVerified: false,
  productsInfo: [],
  userId: 'test-user-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const newListingBody = {
  business_name: 'New Biz',
  business_category: 'Retail',
  description: 'Desc',
  country_of_origin: 'Newland',
};

const newListingData = {
  businessName: 'New Biz',
  businessCategory: 'Retail',
  description: 'Desc',
  countryOfOrigin: 'Newland',
};



const updateData = { description: 'Updated' };

beforeEach(() => {
  jest.clearAllMocks();
  mockAuthEnabled = true;
});

// --------------- Tests -----------------
describe('GET /api/listings', () => {
  it('returns all active listings', async () => {
    mockListingService.listActive.mockResolvedValueOnce([baseListing]);

    const res = await request(app).get('/api/listings');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([baseListing]);
    expect(mockListingService.listActive).toHaveBeenCalled();
  });

  it('handles service errors', async () => {
    mockListingService.listActive.mockRejectedValueOnce(new Error('DB'));
    const res = await request(app).get('/api/listings');
    expect(res.statusCode).toBe(500);
  });
});

describe('GET /api/listings/:id', () => {
  it('returns listing by id', async () => {
    mockListingService.getById.mockResolvedValueOnce(baseListing);
    const res = await request(app).get(`/api/listings/${baseListing.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual(baseListing);
  });

  it('404 when not found', async () => {
    mockListingService.getById.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/listings/999');
    expect(res.statusCode).toBe(404);
  });
});

describe('POST /api/listings', () => {
  it('creates listing when authenticated', async () => {
    mockListingService.create.mockResolvedValueOnce({ id: 'new', userId: 'test-user-id', ...newListingData });
    const res = await request(app).post('/api/listings').send(newListingBody);
    expect(res.statusCode).toBe(201);
    expect(mockListingService.create).toHaveBeenCalledWith('test-user-id', expect.objectContaining(newListingData));
  });

  it('401 when unauthenticated', async () => {
    mockAuthEnabled = false;
    const res = await request(app).post('/api/listings').send(newListingBody);
    expect(res.statusCode).toBe(401);
  });
});

describe('PUT /api/listings/:id', () => {
  it('updates listing for owner', async () => {
    mockListingService.update.mockResolvedValueOnce({ ...baseListing, ...updateData });
    const res = await request(app).put(`/api/listings/${baseListing.id}`).send(updateData);
    expect(res.statusCode).toBe(200);
    expect(mockListingService.update).toHaveBeenCalledWith(Number(baseListing.id), 'test-user-id', updateData);
  });

  it('404 when not found', async () => {
    mockListingService.update.mockResolvedValueOnce(null);
    const res = await request(app).put('/api/listings/999').send(updateData);
    expect(res.statusCode).toBe(404);
  });
});

describe('DELETE /api/listings/:id', () => {
  it('deletes listing', async () => {
    mockListingService.remove.mockResolvedValueOnce(baseListing);
    const res = await request(app).delete(`/api/listings/${baseListing.id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.msg).toBe('Listing deleted.');
    expect(mockListingService.remove).toHaveBeenCalledWith(Number(baseListing.id), 'test-user-id');
  });

  it('404 on service error', async () => {
    mockListingService.remove.mockRejectedValueOnce(new Error('err'));
    const res = await request(app).delete(`/api/listings/${baseListing.id}`);
    expect(res.statusCode).toBe(404);
  });
});

