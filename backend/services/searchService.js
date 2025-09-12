const prisma = require('../prismaClient');

class SearchService {
  constructor() {
    this.searchableFields = {
      services: ['serviceName', 'description', 'category', 'tags', 'location'],
      listings: ['title', 'description', 'category', 'location', 'tags'],
      companies: ['name', 'description', 'industry', 'location'],
      users: ['firstName', 'lastName', 'email', 'bio', 'skills']
    };
  }

  // Advanced service search with filters
  async searchServices({
    query = '',
    category = null,
    location = null,
    minPrice = null,
    maxPrice = null,
    rating = null,
    availability = null,
    tags = [],
    sortBy = 'relevance',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
    providerId = null
  }) {
    try {
      const offset = (page - 1) * limit;
      
      // Build where clause
      const whereClause = {
        isActive: true
      };

      // Text search across multiple fields
      if (query) {
        whereClause.OR = [
          { serviceName: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
          { location: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Category filter
      if (category) {
        whereClause.category = { equals: category, mode: 'insensitive' };
      }

      // Location filter
      if (location) {
        whereClause.location = { contains: location, mode: 'insensitive' };
      }

      // Price range filter
      if (minPrice !== null || maxPrice !== null) {
        whereClause.price = {};
        if (minPrice !== null) whereClause.price.gte = parseFloat(minPrice);
        if (maxPrice !== null) whereClause.price.lte = parseFloat(maxPrice);
      }

      // Provider filter
      if (providerId) {
        whereClause.providerId = parseInt(providerId);
      }

      // Tags filter
      if (tags && tags.length > 0) {
        whereClause.tags = {
          hasEvery: tags
        };
      }

      // Rating filter (requires aggregation)
      let havingClause = {};
      if (rating !== null) {
        havingClause = {
          avgRating: {
            gte: parseFloat(rating)
          }
        };
      }

      // Build order by clause
      let orderBy = [];
      switch (sortBy) {
        case 'price_low':
          orderBy = [{ price: 'asc' }];
          break;
        case 'price_high':
          orderBy = [{ price: 'desc' }];
          break;
        case 'rating':
          orderBy = [{ avgRating: 'desc' }];
          break;
        case 'newest':
          orderBy = [{ createdAt: 'desc' }];
          break;
        case 'popular':
          orderBy = [{ bookingCount: 'desc' }];
          break;
        default: // relevance
          if (query) {
            // For text search, order by relevance (simplified)
            orderBy = [{ updatedAt: 'desc' }];
          } else {
            orderBy = [{ createdAt: 'desc' }];
          }
      }

      // Execute search query
      const services = await prisma.service.findMany({
        where: whereClause,
        include: {
          provider: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true,
              rating: true,
              reviewCount: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          },
          _count: {
            select: {
              bookings: true,
              reviews: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      });

      // Get total count for pagination
      const totalCount = await prisma.service.count({
        where: whereClause
      });

      // Calculate average ratings and enhance results
      const enhancedServices = services.map(service => {
        const avgRating = service.reviews.length > 0
          ? service.reviews.reduce((sum, review) => sum + review.rating, 0) / service.reviews.length
          : 0;

        return {
          ...service,
          avgRating: Math.round(avgRating * 10) / 10,
          bookingCount: service._count.bookings,
          reviewCount: service._count.reviews,
          reviews: undefined, // Remove reviews array to reduce payload
          _count: undefined
        };
      });

      return {
        services: enhancedServices,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        filters: {
          query,
          category,
          location,
          minPrice,
          maxPrice,
          rating,
          tags,
          sortBy
        }
      };

    } catch (error) {
      console.error('❌ Error searching services:', error);
      throw error;
    }
  }

  // Advanced listing search with filters
  async searchListings({
    query = '',
    category = null,
    location = null,
    listingType = null,
    minPrice = null,
    maxPrice = null,
    tags = [],
    sortBy = 'relevance',
    page = 1,
    limit = 20,
    userId = null
  }) {
    try {
      const offset = (page - 1) * limit;
      
      const whereClause = {
        isActive: true
      };

      // Text search
      if (query) {
        whereClause.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { category: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } }
        ];
      }

      // Filters
      if (category) whereClause.category = { equals: category, mode: 'insensitive' };
      if (location) whereClause.location = { contains: location, mode: 'insensitive' };
      if (listingType) whereClause.listingType = listingType;
      if (userId) whereClause.userId = parseInt(userId);

      // Price range
      if (minPrice !== null || maxPrice !== null) {
        whereClause.price = {};
        if (minPrice !== null) whereClause.price.gte = parseFloat(minPrice);
        if (maxPrice !== null) whereClause.price.lte = parseFloat(maxPrice);
      }

      // Order by
      let orderBy = [];
      switch (sortBy) {
        case 'price_low':
          orderBy = [{ price: 'asc' }];
          break;
        case 'price_high':
          orderBy = [{ price: 'desc' }];
          break;
        case 'newest':
          orderBy = [{ createdAt: 'desc' }];
          break;
        default:
          orderBy = [{ updatedAt: 'desc' }];
      }

      const listings = await prisma.businessListing.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profilePicture: true
            }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      });

      const totalCount = await prisma.businessListing.count({
        where: whereClause
      });

      return {
        listings,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        },
        filters: {
          query,
          category,
          location,
          listingType,
          minPrice,
          maxPrice,
          tags,
          sortBy
        }
      };

    } catch (error) {
      console.error('❌ Error searching listings:', error);
      throw error;
    }
  }

  // Search companies
  async searchCompanies({
    query = '',
    industry = null,
    location = null,
    size = null,
    sortBy = 'relevance',
    page = 1,
    limit = 20
  }) {
    try {
      const offset = (page - 1) * limit;
      
      const whereClause = {};

      if (query) {
        whereClause.OR = [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { industry: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } }
        ];
      }

      if (industry) whereClause.industry = { contains: industry, mode: 'insensitive' };
      if (location) whereClause.location = { contains: location, mode: 'insensitive' };
      if (size) whereClause.size = size;

      let orderBy = [];
      switch (sortBy) {
        case 'name':
          orderBy = [{ name: 'asc' }];
          break;
        case 'newest':
          orderBy = [{ createdAt: 'desc' }];
          break;
        default:
          orderBy = [{ updatedAt: 'desc' }];
      }

      const companies = await prisma.company.findMany({
        where: whereClause,
        orderBy,
        take: limit,
        skip: offset
      });

      const totalCount = await prisma.company.count({
        where: whereClause
      });

      return {
        companies,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('❌ Error searching companies:', error);
      throw error;
    }
  }

  // Global search across all entities
  async globalSearch({
    query,
    types = ['services', 'listings', 'companies'],
    limit = 10
  }) {
    try {
      const results = {};

      // Search services
      if (types.includes('services')) {
        const serviceResults = await this.searchServices({
          query,
          limit,
          page: 1
        });
        results.services = serviceResults.services.slice(0, limit);
      }

      // Search listings
      if (types.includes('listings')) {
        const listingResults = await this.searchListings({
          query,
          limit,
          page: 1
        });
        results.listings = listingResults.listings.slice(0, limit);
      }

      // Search companies
      if (types.includes('companies')) {
        const companyResults = await this.searchCompanies({
          query,
          limit,
          page: 1
        });
        results.companies = companyResults.companies.slice(0, limit);
      }

      return {
        query,
        results,
        totalResults: Object.values(results).reduce((sum, arr) => sum + arr.length, 0)
      };

    } catch (error) {
      console.error('❌ Error in global search:', error);
      throw error;
    }
  }

  // Get search suggestions/autocomplete
  async getSearchSuggestions(query, type = 'services', limit = 10) {
    try {
      let suggestions = [];

      switch (type) {
        case 'services':
          const services = await prisma.service.findMany({
            where: {
              OR: [
                { serviceName: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } }
              ],
              isActive: true
            },
            select: {
              serviceName: true,
              category: true
            },
            take: limit
          });
          
          suggestions = [
            ...services.map(s => s.serviceName),
            ...services.map(s => s.category)
          ].filter((value, index, self) => self.indexOf(value) === index);
          break;

        case 'listings':
          const listings = await prisma.businessListing.findMany({
            where: {
              OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { category: { contains: query, mode: 'insensitive' } }
              ],
              isActive: true
            },
            select: {
              title: true,
              category: true
            },
            take: limit
          });
          
          suggestions = [
            ...listings.map(l => l.title),
            ...listings.map(l => l.category)
          ].filter((value, index, self) => self.indexOf(value) === index);
          break;

        case 'companies':
          const companies = await prisma.company.findMany({
            where: {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { industry: { contains: query, mode: 'insensitive' } }
              ]
            },
            select: {
              name: true,
              industry: true
            },
            take: limit
          });
          
          suggestions = [
            ...companies.map(c => c.name),
            ...companies.map(c => c.industry)
          ].filter((value, index, self) => self.indexOf(value) === index);
          break;
      }

      return suggestions.slice(0, limit);

    } catch (error) {
      console.error('❌ Error getting search suggestions:', error);
      throw error;
    }
  }

  // Get popular search terms
  async getPopularSearches(type = 'services', limit = 10) {
    try {
      // This would typically come from search analytics
      // For now, return popular categories/terms
      
      switch (type) {
        case 'services':
          return [
            'Web Development',
            'Digital Marketing',
            'Graphic Design',
            'Consulting',
            'Legal Services',
            'Financial Planning',
            'Content Writing',
            'Photography',
            'Translation',
            'Business Strategy'
          ].slice(0, limit);

        case 'listings':
          return [
            'Software',
            'Marketing',
            'Consulting',
            'E-commerce',
            'Healthcare',
            'Education',
            'Real Estate',
            'Technology',
            'Finance',
            'Manufacturing'
          ].slice(0, limit);

        default:
          return [];
      }

    } catch (error) {
      console.error('❌ Error getting popular searches:', error);
      throw error;
    }
  }

  // Get search filters/facets
  async getSearchFilters(type = 'services') {
    try {
      const filters = {};

      switch (type) {
        case 'services':
          // Get unique categories
          const serviceCategories = await prisma.service.findMany({
            where: { isActive: true },
            select: { category: true },
            distinct: ['category']
          });

          // Get unique locations
          const serviceLocations = await prisma.service.findMany({
            where: { isActive: true },
            select: { location: true },
            distinct: ['location']
          });

          // Get price ranges
          const priceStats = await prisma.service.aggregate({
            where: { isActive: true },
            _min: { price: true },
            _max: { price: true },
            _avg: { price: true }
          });

          filters.categories = serviceCategories.map(s => s.category).filter(Boolean);
          filters.locations = serviceLocations.map(s => s.location).filter(Boolean);
          filters.priceRange = {
            min: priceStats._min.price || 0,
            max: priceStats._max.price || 1000,
            avg: Math.round(priceStats._avg.price || 0)
          };
          break;

        case 'listings':
          const listingCategories = await prisma.businessListing.findMany({
            where: { isActive: true },
            select: { category: true },
            distinct: ['category']
          });

          const listingLocations = await prisma.businessListing.findMany({
            where: { isActive: true },
            select: { location: true },
            distinct: ['location']
          });

          filters.categories = listingCategories.map(l => l.category).filter(Boolean);
          filters.locations = listingLocations.map(l => l.location).filter(Boolean);
          break;
      }

      return filters;

    } catch (error) {
      console.error('❌ Error getting search filters:', error);
      throw error;
    }
  }
}

module.exports = new SearchService();
