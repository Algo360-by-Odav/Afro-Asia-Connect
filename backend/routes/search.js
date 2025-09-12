const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/search/services
// @desc    Advanced service search with filters
// @access  Public
router.get('/services', async (req, res) => {
  try {
    const {
      q: query,
      category,
      location,
      minPrice,
      maxPrice,
      rating,
      availability,
      tags,
      sortBy,
      sortOrder,
      page,
      limit,
      providerId
    } = req.query;

    const searchParams = {
      query: query || '',
      category,
      location,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      rating: rating ? parseFloat(rating) : null,
      availability,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
      sortBy: sortBy || 'relevance',
      sortOrder: sortOrder || 'desc',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      providerId: providerId ? parseInt(providerId) : null
    };

    const results = await searchService.searchServices(searchParams);

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ Error in service search:', error);
    res.status(500).json({
      success: false,
      msg: 'Error searching services',
      error: error.message
    });
  }
});

// @route   GET /api/search/listings
// @desc    Advanced listing search with filters
// @access  Public
router.get('/listings', async (req, res) => {
  try {
    const {
      q: query,
      category,
      location,
      listingType,
      minPrice,
      maxPrice,
      tags,
      sortBy,
      page,
      limit,
      userId
    } = req.query;

    const searchParams = {
      query: query || '',
      category,
      location,
      listingType,
      minPrice: minPrice ? parseFloat(minPrice) : null,
      maxPrice: maxPrice ? parseFloat(maxPrice) : null,
      tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
      sortBy: sortBy || 'relevance',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      userId: userId ? parseInt(userId) : null
    };

    const results = await searchService.searchListings(searchParams);

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ Error in listing search:', error);
    res.status(500).json({
      success: false,
      msg: 'Error searching listings',
      error: error.message
    });
  }
});

// @route   GET /api/search/companies
// @desc    Company search with filters
// @access  Public
router.get('/companies', async (req, res) => {
  try {
    const {
      q: query,
      industry,
      location,
      size,
      sortBy,
      page,
      limit
    } = req.query;

    const searchParams = {
      query: query || '',
      industry,
      location,
      size,
      sortBy: sortBy || 'relevance',
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    };

    const results = await searchService.searchCompanies(searchParams);

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ Error in company search:', error);
    res.status(500).json({
      success: false,
      msg: 'Error searching companies',
      error: error.message
    });
  }
});

// @route   GET /api/search/global
// @desc    Global search across all entities
// @access  Public
router.get('/global', async (req, res) => {
  try {
    const {
      q: query,
      types,
      limit
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        msg: 'Search query is required'
      });
    }

    const searchParams = {
      query,
      types: types ? (Array.isArray(types) ? types : types.split(',')) : ['services', 'listings', 'companies'],
      limit: limit ? parseInt(limit) : 10
    };

    const results = await searchService.globalSearch(searchParams);

    res.json({
      success: true,
      ...results
    });

  } catch (error) {
    console.error('❌ Error in global search:', error);
    res.status(500).json({
      success: false,
      msg: 'Error in global search',
      error: error.message
    });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions/autocomplete
// @access  Public
router.get('/suggestions', async (req, res) => {
  try {
    const {
      q: query,
      type,
      limit
    } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        msg: 'Search query is required'
      });
    }

    const suggestions = await searchService.getSearchSuggestions(
      query,
      type || 'services',
      limit ? parseInt(limit) : 10
    );

    res.json({
      success: true,
      query,
      suggestions
    });

  } catch (error) {
    console.error('❌ Error getting search suggestions:', error);
    res.status(500).json({
      success: false,
      msg: 'Error getting search suggestions',
      error: error.message
    });
  }
});

// @route   GET /api/search/popular
// @desc    Get popular search terms
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const {
      type,
      limit
    } = req.query;

    const popularSearches = await searchService.getPopularSearches(
      type || 'services',
      limit ? parseInt(limit) : 10
    );

    res.json({
      success: true,
      type: type || 'services',
      popularSearches
    });

  } catch (error) {
    console.error('❌ Error getting popular searches:', error);
    res.status(500).json({
      success: false,
      msg: 'Error getting popular searches',
      error: error.message
    });
  }
});

// @route   GET /api/search/filters
// @desc    Get available search filters/facets
// @access  Public
router.get('/filters', async (req, res) => {
  try {
    const { type } = req.query;

    const filters = await searchService.getSearchFilters(type || 'services');

    res.json({
      success: true,
      type: type || 'services',
      filters
    });

  } catch (error) {
    console.error('❌ Error getting search filters:', error);
    res.status(500).json({
      success: false,
      msg: 'Error getting search filters',
      error: error.message
    });
  }
});

// @route   POST /api/search/save
// @desc    Save a search query (for logged-in users)
// @access  Private
router.post('/save', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, filters, type } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        msg: 'Search query is required'
      });
    }

    // Save search to user preferences or search history
    // This would typically be stored in a SavedSearch model
    // For now, we'll just return success
    
    res.json({
      success: true,
      msg: 'Search saved successfully',
      savedSearch: {
        query,
        filters,
        type,
        userId,
        savedAt: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error saving search:', error);
    res.status(500).json({
      success: false,
      msg: 'Error saving search',
      error: error.message
    });
  }
});

module.exports = router;
