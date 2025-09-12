const prisma = require('../prismaClient');
const notificationService = require('./notificationService');

class ReviewService {
  // Create a new review
  async createReview({
    bookingId,
    serviceId,
    customerId,
    providerId,
    rating,
    title,
    comment,
    tags = []
  }) {
    try {
      // Verify booking exists and belongs to customer
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(bookingId) },
        include: {
          service: {
            select: {
              id: true,
              serviceName: true,
              providerId: true
            }
          }
        }
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.customerId !== parseInt(customerId)) {
        throw new Error('Unauthorized to review this booking');
      }

      if (booking.status !== 'COMPLETED') {
        throw new Error('Can only review completed bookings');
      }

      // Check if review already exists
      const existingReview = await prisma.serviceReview.findFirst({
        where: {
          bookingId: parseInt(bookingId),
          customerId: parseInt(customerId)
        }
      });

      if (existingReview) {
        throw new Error('Review already exists for this booking');
      }

      // Create review
      const review = await prisma.serviceReview.create({
        data: {
          bookingId: parseInt(bookingId),
          serviceId: parseInt(serviceId),
          customerId: parseInt(customerId),
          providerId: parseInt(providerId),
          rating: parseInt(rating),
          title,
          comment,
          tags,
          isVerified: true, // Since it's from a completed booking
          createdAt: new Date()
        },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          },
          service: {
            select: {
              id: true,
              serviceName: true,
              category: true
            }
          }
        }
      });

      // Update service average rating
      await this.updateServiceRating(serviceId);

      // Send notification to provider
      await notificationService.notifyReviewReceived(review, providerId);

      console.log(`✅ Review created for service ${serviceId} by customer ${customerId}`);
      return review;

    } catch (error) {
      console.error('❌ Error creating review:', error);
      throw error;
    }
  }

  // Get reviews for a service
  async getServiceReviews(serviceId, { page = 1, limit = 10, rating = null, sortBy = 'newest' } = {}) {
    try {
      const offset = (page - 1) * limit;
      
      const whereClause = {
        serviceId: parseInt(serviceId),
        isActive: true
      };

      if (rating) {
        whereClause.rating = parseInt(rating);
      }

      let orderBy = [];
      switch (sortBy) {
        case 'rating_high':
          orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
          break;
        case 'rating_low':
          orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
          break;
        case 'helpful':
          orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }];
          break;
        case 'oldest':
          orderBy = [{ createdAt: 'asc' }];
          break;
        default: // newest
          orderBy = [{ createdAt: 'desc' }];
      }

      const reviews = await prisma.serviceReview.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          },
          responses: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy,
        take: limit,
        skip: offset
      });

      const totalCount = await prisma.serviceReview.count({
        where: whereClause
      });

      // Calculate review statistics
      const stats = await this.getReviewStats(serviceId);

      return {
        reviews,
        stats,
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
      console.error('❌ Error getting service reviews:', error);
      throw error;
    }
  }

  // Get reviews for a provider
  async getProviderReviews(providerId, { page = 1, limit = 10, rating = null, serviceId = null } = {}) {
    try {
      const offset = (page - 1) * limit;
      
      const whereClause = {
        providerId: parseInt(providerId),
        isActive: true
      };

      if (rating) whereClause.rating = parseInt(rating);
      if (serviceId) whereClause.serviceId = parseInt(serviceId);

      const reviews = await prisma.serviceReview.findMany({
        where: whereClause,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePicture: true
            }
          },
          service: {
            select: {
              id: true,
              serviceName: true,
              category: true
            }
          },
          responses: {
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const totalCount = await prisma.serviceReview.count({
        where: whereClause
      });

      return {
        reviews,
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
      console.error('❌ Error getting provider reviews:', error);
      throw error;
    }
  }

  // Respond to a review
  async respondToReview(reviewId, authorId, responseText) {
    try {
      // Verify review exists and user can respond
      const review = await prisma.serviceReview.findUnique({
        where: { id: parseInt(reviewId) },
        include: {
          service: {
            select: { providerId: true }
          }
        }
      });

      if (!review) {
        throw new Error('Review not found');
      }

      // Only provider can respond to their reviews
      if (review.service.providerId !== parseInt(authorId)) {
        throw new Error('Unauthorized to respond to this review');
      }

      const response = await prisma.reviewResponse.create({
        data: {
          reviewId: parseInt(reviewId),
          authorId: parseInt(authorId),
          responseText,
          createdAt: new Date()
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      console.log(`✅ Response added to review ${reviewId}`);
      return response;

    } catch (error) {
      console.error('❌ Error responding to review:', error);
      throw error;
    }
  }

  // Mark review as helpful
  async markReviewHelpful(reviewId, userId) {
    try {
      // Check if user already marked as helpful
      const existingHelpful = await prisma.reviewHelpful.findFirst({
        where: {
          reviewId: parseInt(reviewId),
          userId: parseInt(userId)
        }
      });

      if (existingHelpful) {
        // Remove helpful mark
        await prisma.reviewHelpful.delete({
          where: { id: existingHelpful.id }
        });

        // Decrement helpful count
        await prisma.serviceReview.update({
          where: { id: parseInt(reviewId) },
          data: {
            helpfulCount: {
              decrement: 1
            }
          }
        });

        return { helpful: false, message: 'Helpful mark removed' };
      } else {
        // Add helpful mark
        await prisma.reviewHelpful.create({
          data: {
            reviewId: parseInt(reviewId),
            userId: parseInt(userId)
          }
        });

        // Increment helpful count
        await prisma.serviceReview.update({
          where: { id: parseInt(reviewId) },
          data: {
            helpfulCount: {
              increment: 1
            }
          }
        });

        return { helpful: true, message: 'Review marked as helpful' };
      }

    } catch (error) {
      console.error('❌ Error marking review helpful:', error);
      throw error;
    }
  }

  // Get review statistics for a service
  async getReviewStats(serviceId) {
    try {
      const stats = await prisma.serviceReview.aggregate({
        where: {
          serviceId: parseInt(serviceId),
          isActive: true
        },
        _count: { id: true },
        _avg: { rating: true }
      });

      // Get rating distribution
      const ratingDistribution = await prisma.serviceReview.groupBy({
        by: ['rating'],
        where: {
          serviceId: parseInt(serviceId),
          isActive: true
        },
        _count: { rating: true }
      });

      const distribution = {};
      for (let i = 1; i <= 5; i++) {
        distribution[i] = 0;
      }
      ratingDistribution.forEach(item => {
        distribution[item.rating] = item._count.rating;
      });

      return {
        totalReviews: stats._count.id || 0,
        averageRating: stats._avg.rating ? Math.round(stats._avg.rating * 10) / 10 : 0,
        ratingDistribution: distribution
      };

    } catch (error) {
      console.error('❌ Error getting review stats:', error);
      throw error;
    }
  }

  // Update service average rating
  async updateServiceRating(serviceId) {
    try {
      const stats = await this.getReviewStats(serviceId);
      
      await prisma.service.update({
        where: { id: parseInt(serviceId) },
        data: {
          avgRating: stats.averageRating,
          reviewCount: stats.totalReviews
        }
      });

      console.log(`✅ Updated service ${serviceId} rating: ${stats.averageRating}`);

    } catch (error) {
      console.error('❌ Error updating service rating:', error);
      throw error;
    }
  }

  // Get provider review analytics
  async getProviderAnalytics(providerId, startDate, endDate) {
    try {
      const reviews = await prisma.serviceReview.findMany({
        where: {
          providerId: parseInt(providerId),
          isActive: true,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          service: {
            select: {
              serviceName: true,
              category: true
            }
          }
        }
      });

      // Calculate analytics
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      // Rating distribution
      const ratingDistribution = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = reviews.filter(r => r.rating === i).length;
      }

      // Reviews by service
      const reviewsByService = reviews.reduce((acc, review) => {
        const serviceName = review.service.serviceName;
        if (!acc[serviceName]) {
          acc[serviceName] = { count: 0, totalRating: 0 };
        }
        acc[serviceName].count++;
        acc[serviceName].totalRating += review.rating;
        return acc;
      }, {});

      // Convert to array with average ratings
      const serviceStats = Object.entries(reviewsByService).map(([name, stats]) => ({
        serviceName: name,
        reviewCount: stats.count,
        averageRating: Math.round((stats.totalRating / stats.count) * 10) / 10
      }));

      // Monthly trend (simplified)
      const monthlyStats = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthReviews = reviews.filter(r => 
          r.createdAt >= monthStart && r.createdAt <= monthEnd
        );
        
        const monthAvg = monthReviews.length > 0
          ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length
          : 0;

        monthlyStats.push({
          month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
          reviews: monthReviews.length,
          rating: Math.round(monthAvg * 10) / 10
        });
      }

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        serviceStats,
        monthlyStats,
        period: { startDate, endDate }
      };

    } catch (error) {
      console.error('❌ Error getting provider analytics:', error);
      throw error;
    }
  }

  // Flag review for moderation
  async flagReview(reviewId, userId, reason) {
    try {
      const flag = await prisma.reviewFlag.create({
        data: {
          reviewId: parseInt(reviewId),
          flaggedBy: parseInt(userId),
          reason,
          status: 'PENDING',
          createdAt: new Date()
        }
      });

      // Update review status
      await prisma.serviceReview.update({
        where: { id: parseInt(reviewId) },
        data: { isFlagged: true }
      });

      console.log(`🚩 Review ${reviewId} flagged for moderation`);
      return flag;

    } catch (error) {
      console.error('❌ Error flagging review:', error);
      throw error;
    }
  }

  // Request review from customer
  async requestReview(providerId, customerId, bookingId, message = null) {
    try {
      // Verify booking
      const booking = await prisma.booking.findUnique({
        where: { id: parseInt(bookingId) },
        include: {
          customer: {
            select: {
              email: true,
              firstName: true,
              lastName: true
            }
          },
          service: {
            select: {
              serviceName: true,
              providerId: true
            }
          }
        }
      });

      if (!booking || booking.service.providerId !== parseInt(providerId)) {
        throw new Error('Unauthorized or booking not found');
      }

      if (booking.status !== 'COMPLETED') {
        throw new Error('Can only request reviews for completed bookings');
      }

      // Check if review already exists
      const existingReview = await prisma.serviceReview.findFirst({
        where: {
          bookingId: parseInt(bookingId),
          customerId: parseInt(customerId)
        }
      });

      if (existingReview) {
        throw new Error('Review already exists for this booking');
      }

      // Create review request
      const reviewRequest = await prisma.reviewRequest.create({
        data: {
          providerId: parseInt(providerId),
          customerId: parseInt(customerId),
          bookingId: parseInt(bookingId),
          message,
          status: 'SENT',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          createdAt: new Date()
        }
      });

      // Send notification to customer
      await notificationService.createNotification({
        userId: customerId,
        type: 'REVIEW_REQUEST',
        title: 'Review Request',
        message: `Please share your experience with ${booking.service.serviceName}`,
        data: { bookingId, reviewRequestId: reviewRequest.id },
        priority: 'MEDIUM',
        sendEmail: true,
        actionUrl: `/review/${reviewRequest.id}`
      });

      console.log(`📧 Review request sent to customer ${customerId}`);
      return reviewRequest;

    } catch (error) {
      console.error('❌ Error requesting review:', error);
      throw error;
    }
  }
}

module.exports = new ReviewService();
