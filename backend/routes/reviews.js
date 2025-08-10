const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get reviews overview and statistics
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Simulated reviews overview data
    const reviewsOverview = {
      totalReviews: 247,
      averageRating: 4.6,
      ratingDistribution: {
        5: 156,
        4: 62,
        3: 18,
        2: 7,
        1: 4
      },
      recentReviews: 23,
      responseRate: 89,
      averageResponseTime: 2.4, // hours
      sentimentScore: 92,
      reputationTrend: 'up',
      monthlyStats: [
        { month: 'Jan', reviews: 18, rating: 4.4 },
        { month: 'Feb', reviews: 22, rating: 4.5 },
        { month: 'Mar', reviews: 28, rating: 4.6 },
        { month: 'Apr', reviews: 31, rating: 4.7 },
        { month: 'May', reviews: 26, rating: 4.6 }
      ],
      topKeywords: [
        { word: 'professional', count: 89, sentiment: 'positive' },
        { word: 'quality', count: 76, sentiment: 'positive' },
        { word: 'responsive', count: 64, sentiment: 'positive' },
        { word: 'reliable', count: 58, sentiment: 'positive' },
        { word: 'expensive', count: 12, sentiment: 'negative' }
      ]
    };

    res.json({ overview: reviewsOverview });
  } catch (error) {
    console.error('Error fetching reviews overview:', error);
    res.status(500).json({ error: 'Failed to fetch reviews overview' });
  }
});

// Get all reviews with filtering and pagination
router.get('/reviews', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, rating, status, sortBy = 'date' } = req.query;
    
    // Simulated reviews data
    const allReviews = [
      {
        id: 1,
        customerName: 'Sarah Johnson',
        customerAvatar: null,
        rating: 5,
        title: 'Excellent Service!',
        comment: 'Outstanding work quality and very professional team. They delivered exactly what we needed on time and within budget. Highly recommended!',
        date: new Date('2024-05-15'),
        service: 'Web Development',
        status: 'published',
        helpful: 12,
        response: {
          text: 'Thank you so much for your kind words! We\'re thrilled that you\'re happy with our service.',
          date: new Date('2024-05-16'),
          author: 'Team Lead'
        },
        verified: true,
        sentiment: 'positive'
      },
      {
        id: 2,
        customerName: 'Mike Chen',
        customerAvatar: null,
        rating: 4,
        title: 'Great Communication',
        comment: 'The team was very responsive and kept us updated throughout the project. Minor delays but overall satisfied with the outcome.',
        date: new Date('2024-05-12'),
        service: 'Digital Marketing',
        status: 'published',
        helpful: 8,
        response: null,
        verified: true,
        sentiment: 'positive'
      },
      {
        id: 3,
        customerName: 'Emma Wilson',
        customerAvatar: null,
        rating: 5,
        title: 'Exceeded Expectations',
        comment: 'Absolutely fantastic! The quality of work was beyond what we expected. Professional, creative, and delivered on time.',
        date: new Date('2024-05-10'),
        service: 'Graphic Design',
        status: 'published',
        helpful: 15,
        response: {
          text: 'We\'re so glad we could exceed your expectations! Thank you for choosing us.',
          date: new Date('2024-05-11'),
          author: 'Creative Director'
        },
        verified: true,
        sentiment: 'positive'
      },
      {
        id: 4,
        customerName: 'David Kim',
        customerAvatar: null,
        rating: 3,
        title: 'Good but Room for Improvement',
        comment: 'The service was decent but took longer than expected. Communication could be better. Final result was satisfactory.',
        date: new Date('2024-05-08'),
        service: 'Consulting',
        status: 'published',
        helpful: 5,
        response: {
          text: 'Thank you for your feedback. We\'re working on improving our communication process.',
          date: new Date('2024-05-09'),
          author: 'Project Manager'
        },
        verified: true,
        sentiment: 'neutral'
      },
      {
        id: 5,
        customerName: 'Lisa Zhang',
        customerAvatar: null,
        rating: 5,
        title: 'Highly Professional',
        comment: 'Exceptional service from start to finish. The team understood our requirements perfectly and delivered outstanding results.',
        date: new Date('2024-05-05'),
        service: 'Software Development',
        status: 'published',
        helpful: 18,
        response: null,
        verified: true,
        sentiment: 'positive'
      },
      {
        id: 6,
        customerName: 'Alex Rivera',
        customerAvatar: null,
        rating: 4,
        title: 'Solid Work',
        comment: 'Good quality work and reasonable pricing. Would work with them again for future projects.',
        date: new Date('2024-05-03'),
        service: 'Content Writing',
        status: 'published',
        helpful: 9,
        response: {
          text: 'Thank you! We look forward to working with you again.',
          date: new Date('2024-05-04'),
          author: 'Content Manager'
        },
        verified: true,
        sentiment: 'positive'
      },
      {
        id: 7,
        customerName: 'James Brown',
        customerAvatar: null,
        rating: 2,
        title: 'Disappointing Experience',
        comment: 'The project was delayed multiple times and the final quality didn\'t meet our expectations. Customer service needs improvement.',
        date: new Date('2024-05-01'),
        service: 'Web Design',
        status: 'published',
        helpful: 3,
        response: {
          text: 'We sincerely apologize for not meeting your expectations. We\'ve made improvements to prevent this in the future.',
          date: new Date('2024-05-02'),
          author: 'Customer Success Manager'
        },
        verified: true,
        sentiment: 'negative'
      },
      {
        id: 8,
        customerName: 'Maria Garcia',
        customerAvatar: null,
        rating: 5,
        title: 'Amazing Results!',
        comment: 'Incredible work! They transformed our brand identity completely. Very creative and professional approach.',
        date: new Date('2024-04-28'),
        service: 'Branding',
        status: 'published',
        helpful: 21,
        response: null,
        verified: true,
        sentiment: 'positive'
      }
    ];

    // Filter reviews
    let filteredReviews = allReviews;
    if (rating && rating !== 'all') {
      filteredReviews = filteredReviews.filter(review => review.rating === parseInt(rating));
    }
    if (status && status !== 'all') {
      filteredReviews = filteredReviews.filter(review => review.status === status);
    }

    // Sort reviews
    filteredReviews.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'helpful':
          return b.helpful - a.helpful;
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

    res.json({
      reviews: paginatedReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(filteredReviews.length / limit),
        totalReviews: filteredReviews.length,
        hasNext: endIndex < filteredReviews.length,
        hasPrev: startIndex > 0
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Get reputation analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = '30d' } = req.query;
    
    const analytics = {
      reputationScore: 92,
      competitorComparison: {
        yourRating: 4.6,
        industryAverage: 4.2,
        topCompetitor: 4.4
      },
      sentimentAnalysis: {
        positive: 78,
        neutral: 16,
        negative: 6
      },
      reviewSources: [
        { source: 'Direct Platform', count: 156, percentage: 63 },
        { source: 'Google Reviews', count: 52, percentage: 21 },
        { source: 'Social Media', count: 28, percentage: 11 },
        { source: 'Third Party', count: 11, percentage: 5 }
      ],
      responseMetrics: {
        responseRate: 89,
        averageResponseTime: 2.4,
        responseQuality: 94
      },
      impactMetrics: {
        conversionIncrease: 23,
        trustScoreImprovement: 18,
        repeatCustomers: 67
      },
      trendData: [
        { period: 'Week 1', reviews: 6, rating: 4.5, sentiment: 85 },
        { period: 'Week 2', reviews: 8, rating: 4.6, sentiment: 88 },
        { period: 'Week 3', reviews: 5, rating: 4.7, sentiment: 92 },
        { period: 'Week 4', reviews: 7, rating: 4.6, sentiment: 89 }
      ]
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Error fetching review analytics:', error);
    res.status(500).json({ error: 'Failed to fetch review analytics' });
  }
});

// Respond to a review
router.post('/reviews/:reviewId/respond', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { response } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!response || response.trim().length === 0) {
      return res.status(400).json({ error: 'Response text is required' });
    }

    // In production, this would:
    // 1. Save response to database
    // 2. Send notification to customer
    // 3. Update review status

    const reviewResponse = {
      id: Date.now(),
      reviewId: parseInt(reviewId),
      text: response,
      date: new Date(),
      author: req.user.name || 'Service Provider'
    };

    res.json({ 
      success: true, 
      response: reviewResponse,
      message: 'Response posted successfully' 
    });
  } catch (error) {
    console.error('Error posting review response:', error);
    res.status(500).json({ error: 'Failed to post response' });
  }
});

// Request review from customer
router.post('/request-review', async (req, res) => {
  try {
    const { customerEmail, customerName, serviceType, message } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!customerEmail || !customerName) {
      return res.status(400).json({ error: 'Customer email and name are required' });
    }

    // In production, this would:
    // 1. Create review request record
    // 2. Send review request email
    // 3. Track request status

    const reviewRequest = {
      id: Date.now(),
      customerEmail,
      customerName,
      serviceType,
      message,
      requestedAt: new Date(),
      status: 'sent',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    };

    res.json({ 
      success: true, 
      request: reviewRequest,
      message: 'Review request sent successfully' 
    });
  } catch (error) {
    console.error('Error sending review request:', error);
    res.status(500).json({ error: 'Failed to send review request' });
  }
});

// Get review requests
router.get('/requests', async (req, res) => {
  try {
    const requests = [
      {
        id: 1,
        customerEmail: 'john.doe@example.com',
        customerName: 'John Doe',
        serviceType: 'Web Development',
        requestedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        status: 'pending',
        expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        customerEmail: 'jane.smith@example.com',
        customerName: 'Jane Smith',
        serviceType: 'Digital Marketing',
        requestedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        status: 'completed',
        expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000)
      }
    ];

    res.json({ requests });
  } catch (error) {
    console.error('Error fetching review requests:', error);
    res.status(500).json({ error: 'Failed to fetch review requests' });
  }
});

// Flag inappropriate review
router.post('/reviews/:reviewId/flag', async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // In production, this would:
    // 1. Create moderation request
    // 2. Notify moderation team
    // 3. Update review status

    res.json({ 
      success: true, 
      message: 'Review flagged for moderation',
      reviewId: parseInt(reviewId),
      reason
    });
  } catch (error) {
    console.error('Error flagging review:', error);
    res.status(500).json({ error: 'Failed to flag review' });
  }
});

// Get review insights and recommendations
router.get('/insights', async (req, res) => {
  try {
    const insights = {
      recommendations: [
        {
          type: 'response_rate',
          title: 'Improve Response Rate',
          description: 'You have 11% of reviews without responses. Responding to all reviews can improve your reputation.',
          priority: 'high',
          action: 'Respond to pending reviews'
        },
        {
          type: 'response_time',
          title: 'Faster Response Time',
          description: 'Your average response time is 2.4 hours. Industry best practice is under 2 hours.',
          priority: 'medium',
          action: 'Set up review notifications'
        },
        {
          type: 'review_requests',
          title: 'Request More Reviews',
          description: 'You could increase your review volume by 40% by actively requesting reviews from satisfied customers.',
          priority: 'medium',
          action: 'Send review requests'
        }
      ],
      opportunities: [
        {
          area: 'Communication',
          mentions: 23,
          sentiment: 'positive',
          suggestion: 'Highlight your communication skills in service descriptions'
        },
        {
          area: 'Timeliness',
          mentions: 8,
          sentiment: 'mixed',
          suggestion: 'Consider setting more realistic delivery timelines'
        },
        {
          area: 'Quality',
          mentions: 76,
          sentiment: 'positive',
          suggestion: 'Use quality testimonials in your marketing materials'
        }
      ],
      competitorInsights: {
        strengths: ['Quality', 'Professionalism', 'Responsiveness'],
        weaknesses: ['Pricing', 'Delivery Time'],
        opportunities: ['Customer Service', 'Innovation']
      }
    };

    res.json({ insights });
  } catch (error) {
    console.error('Error fetching review insights:', error);
    res.status(500).json({ error: 'Failed to fetch review insights' });
  }
});

module.exports = router;
