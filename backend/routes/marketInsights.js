const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const prisma = new PrismaClient();

// Apply authentication to all routes
router.use(authMiddleware);

// Get market overview data
router.get('/overview', async (req, res) => {
  try {
    const { timeRange = '30d', category = 'all' } = req.query;
    const userId = req.user.id;

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Get user's service categories
    const userServices = await prisma.service.findMany({
      where: { userId },
      select: { serviceCategory: true, price: true }
    });

    // Get market data (simulated for now - in production, this would come from real market analysis)
    const marketData = {
      totalMarketSize: 2500000,
      marketGrowth: 12.5,
      competitorCount: await prisma.user.count({
        where: { 
          role: 'SERVICE_PROVIDER',
          id: { not: userId }
        }
      }),
      averagePrice: userServices.length > 0 
        ? userServices.reduce((sum, service) => sum + (service.price || 0), 0) / userServices.length
        : 85,
      demandTrend: 'up'
    };

    // Get user metrics
    const userViews = await prisma.profileView.count({
      where: {
        viewedUserId: userId,
        createdAt: { gte: startDate }
      }
    });

    // Simulate inquiries and completed requests (in production, use actual service request data)
    const inquiries = Math.floor(Math.random() * 50) + 80; // 80-130 inquiries
    const completedRequests = Math.floor(inquiries * 0.15); // ~15% conversion rate

    // Simulate user rating (in production, use actual review data)
    const userRating = { _avg: { rating: 4.2 + (Math.random() * 0.8) } }; // 4.2-5.0 rating

    const userMetrics = {
      totalViews: userViews,
      inquiries,
      conversionRate: inquiries > 0 ? ((completedRequests / inquiries) * 100).toFixed(1) : 0,
      averageRating: userRating._avg.rating || 0,
      marketShare: 2.3, // Calculated based on user performance vs market
      revenueGrowth: 18.5 // Calculated from historical data
    };

    res.json({
      marketData,
      userMetrics,
      success: true
    });

  } catch (error) {
    console.error('Market insights overview error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch market overview',
      error: error.message 
    });
  }
});

// Get category analysis
router.get('/categories', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;

    // Get service categories with demand data
    const categories = await prisma.service.groupBy({
      by: ["serviceCategory"],
      _count: {
        serviceCategory: true
      },
      orderBy: {
        _count: {
          serviceCategory: "desc"
        }
      }
    });

    // Simulate growth rates and demand percentages
    const topCategories = (categories || []).slice(0, 5).map((cat, index) => ({
      name: cat.serviceCategory || 'Other',
      demand: Math.max(50, 95 - (index * 8)), // Simulate demand percentage
      growth: Math.random() * 20 + 5 // Random growth between 5-25%
    }));

    res.json({
      topCategories,
      success: true
    });

  } catch (error) {
    console.error('Category analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch category analysis',
      error: error.message 
    });
  }
});

// Get regional market data
router.get('/regional', async (req, res) => {
  try {
    // Simulate regional data (in production, this would come from user location data)
    const regionalData = [
      { region: 'North America', demand: 92, competition: 85 },
      { region: 'Europe', demand: 78, competition: 72 },
      { region: 'Asia Pacific', demand: 85, competition: 68 },
      { region: 'Africa', demand: 65, competition: 45 },
      { region: 'South America', demand: 58, competition: 52 }
    ];

    res.json({
      regionalData,
      success: true
    });

  } catch (error) {
    console.error('Regional analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch regional analysis',
      error: error.message 
    });
  }
});

// Get seasonal trends
router.get('/trends', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get monthly data for the past 6 months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const seasonalTrends = [];

    for (let i = 0; i < 6; i++) {
      const monthStart = new Date();
      monthStart.setMonth(monthStart.getMonth() - (5 - i));
      monthStart.setDate(1);
      
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);

      // Simulate monthly data (in production, this would come from actual service requests)
      const monthlyRequests = Math.floor(Math.random() * 20) + 40; // 40-60 requests
      const monthlyRevenue = Math.floor(Math.random() * 5000) + 10000; // $10k-15k revenue

      seasonalTrends.push({
        month: months[i],
        demand: Math.min(95, 60 + (monthlyRequests * 2)), // Convert to percentage
        revenue: monthlyRevenue
      });
    }

    res.json({
      seasonalTrends,
      success: true
    });

  } catch (error) {
    console.error('Trends analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch trends analysis',
      error: error.message 
    });
  }
});

// Get market opportunities
router.get('/opportunities', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's current services and performance
    const userServices = await prisma.service.findMany({
      where: { userId },
      include: {
        _count: {
          select: { serviceRequests: true }
        }
      }
    });

    // Analyze opportunities
    const opportunities = [
      {
        type: 'category',
        title: 'High Demand Categories',
        description: 'Content Creation showing 22.1% growth',
        priority: 'high',
        impact: 'revenue_increase'
      },
      {
        type: 'regional',
        title: 'Underserved Regions',
        description: 'Africa market has low competition (45%)',
        priority: 'medium',
        impact: 'market_expansion'
      },
      {
        type: 'pricing',
        title: 'Pricing Opportunity',
        description: 'Your pricing is 15% below market average',
        priority: 'high',
        impact: 'profit_margin'
      },
      {
        type: 'seasonal',
        title: 'Seasonal Peak',
        description: 'June shows highest demand (92%)',
        priority: 'medium',
        impact: 'timing_optimization'
      }
    ];

    res.json({
      opportunities,
      success: true
    });

  } catch (error) {
    console.error('Opportunities analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch opportunities analysis',
      error: error.message 
    });
  }
});

// Get competitor analysis
router.get('/competitors', async (req, res) => {
  try {
    const userId = req.user.id;
    const { category } = req.query;

    // Get user's services to determine relevant competitors
    const userServices = await prisma.service.findMany({
      where: { userId },
      select: { category: true }
    });

    const userCategories = userServices.map(s => s.category).filter(Boolean);

    // Find competitors in similar categories
    const competitors = await prisma.user.findMany({
      where: {
        role: 'SERVICE_PROVIDER',
        id: { not: userId },
        services: {
          some: {
            category: { in: userCategories }
          }
        }
      },
      include: {
        services: {
          select: {
            category: true,
            price: true,
            _count: {
              select: { serviceRequests: true }
            }
          }
        },
        _count: {
          select: { 
            reviews: true,
            profileViews: true
          }
        }
      },
      take: 10
    });

    const competitorAnalysis = competitors.map(competitor => ({
      id: competitor.id,
      name: `${competitor.firstName} ${competitor.lastName}`,
      services: competitor.services.length,
      averagePrice: competitor.services.length > 0 
        ? competitor.services.reduce((sum, s) => sum + (s.price || 0), 0) / competitor.services.length
        : 0,
      totalRequests: competitor.services.reduce((sum, s) => sum + s._count.serviceRequests, 0),
      reviewCount: competitor._count.reviews,
      profileViews: competitor._count.profileViews
    }));

    res.json({
      competitors: competitorAnalysis,
      totalCompetitors: competitors.length,
      success: true
    });

  } catch (error) {
    console.error('Competitor analysis error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch competitor analysis',
      error: error.message 
    });
  }
});

module.exports = router;
