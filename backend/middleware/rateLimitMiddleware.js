const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Store for tracking rate limits in memory (can be replaced with Redis in production)
const rateLimitStore = new Map();

// Simple in-memory rate limit store
class MemoryRateLimitStore {
  constructor() {
    this.hits = new Map();
    this.resetTimes = new Map();
  }

  async incr(key) {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const windowStart = now - windowMs;
    
    if (!this.hits.has(key)) {
      this.hits.set(key, []);
    }
    
    const keyHits = this.hits.get(key);
    
    // Clean old hits
    const validHits = keyHits.filter(hit => hit > windowStart);
    validHits.push(now);
    
    this.hits.set(key, validHits);
    this.resetTimes.set(key, new Date(now + windowMs));
    
    return {
      totalHits: validHits.length,
      resetTime: this.resetTimes.get(key)
    };
  }

  async decrement(key) {
    if (this.hits.has(key)) {
      const keyHits = this.hits.get(key);
      if (keyHits.length > 0) {
        keyHits.pop();
        this.hits.set(key, keyHits);
      }
    }
  }

  async resetKey(key) {
    this.hits.delete(key);
    this.resetTimes.delete(key);
  }
}

// General API rate limiting
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MemoryRateLimitStore()
});

// Strict rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: new MemoryRateLimitStore()
});

// Payment endpoint rate limiting
const paymentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Limit each IP to 3 payment requests per minute
  message: {
    error: 'Too many payment requests, please wait before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MemoryRateLimitStore()
});

// File upload rate limiting
const uploadRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 uploads per minute
  message: {
    error: 'Too many file uploads, please wait before uploading more files.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MemoryRateLimitStore()
});

// Email sending rate limiting
const emailRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 emails per minute
  message: {
    error: 'Too many email requests, please wait before sending more emails.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MemoryRateLimitStore()
});

// Search rate limiting
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 searches per minute
  message: {
    error: 'Too many search requests, please wait before searching again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new MemoryRateLimitStore()
});

// Speed limiting middleware (slows down requests instead of blocking)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 50, // Allow 50 requests per windowMs without delay
  delayMs: () => 500, // Add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // Maximum delay of 20 seconds
  validate: { delayMs: false } // Disable warning message
});

// User-specific rate limiting based on authentication
const createUserRateLimit = (maxRequests = 1000, windowMs = 15 * 60 * 1000) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const key = `user:${userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    try {
      // Get or create user rate limit record
      let userLimit = rateLimitStore.get(key);
      if (!userLimit) {
        userLimit = { requests: [], resetTime: now + windowMs };
        rateLimitStore.set(key, userLimit);
      }

      // Clean old requests
      userLimit.requests = userLimit.requests.filter(time => time > windowStart);

      // Check if limit exceeded
      if (userLimit.requests.length >= maxRequests) {
        return res.status(429).json({
          error: 'User rate limit exceeded',
          retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
        });
      }

      // Add current request
      userLimit.requests.push(now);

      // Set headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': Math.max(0, maxRequests - userLimit.requests.length),
        'X-RateLimit-Reset': Math.ceil(userLimit.resetTime / 1000)
      });

      next();
    } catch (error) {
      console.error('User rate limit error:', error);
      next();
    }
  };
};

// Role-based rate limiting
const createRoleBasedRateLimit = () => {
  return async (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const role = req.user.role;
    let maxRequests = 100; // Default for customers
    let windowMs = 15 * 60 * 1000; // 15 minutes

    // Adjust limits based on role
    switch (role) {
      case 'ADMIN':
        maxRequests = 1000;
        break;
      case 'PROVIDER':
        maxRequests = 500;
        break;
      case 'CUSTOMER':
        maxRequests = 100;
        break;
      default:
        maxRequests = 50;
    }

    return createUserRateLimit(maxRequests, windowMs)(req, res, next);
  };
};

// Suspicious activity detection
const suspiciousActivityDetection = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || 'unknown';
  const now = new Date();

  try {
    // Log request for analysis
    await prisma.requestLog.create({
      data: {
        ip,
        userAgent,
        method: req.method,
        path: req.path,
        userId: req.user?.id || null,
        timestamp: now
      }
    });

    // Check for suspicious patterns
    const recentRequests = await prisma.requestLog.count({
      where: {
        ip,
        timestamp: {
          gte: new Date(now.getTime() - 60000) // Last minute
        }
      }
    });

    // Flag suspicious activity (more than 100 requests per minute from same IP)
    if (recentRequests > 100) {
      console.warn(`🚨 Suspicious activity detected from IP: ${ip}`);
      
      // Create security alert
      await prisma.securityAlert.create({
        data: {
          type: 'SUSPICIOUS_ACTIVITY',
          description: `High request volume from IP: ${ip}`,
          ip,
          userAgent,
          severity: 'HIGH',
          metadata: { requestCount: recentRequests }
        }
      });

      return res.status(429).json({
        error: 'Suspicious activity detected. Please contact support if you believe this is an error.'
      });
    }

    next();
  } catch (error) {
    console.error('Suspicious activity detection error:', error);
    next();
  }
};

// Cleanup old rate limit entries (should be run periodically)
const cleanupRateLimitEntries = async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    await prisma.rateLimitEntry.deleteMany({
      where: {
        createdAt: { lt: oneHourAgo }
      }
    });

    await prisma.requestLog.deleteMany({
      where: {
        timestamp: { lt: oneHourAgo }
      }
    });

    console.log('✅ Rate limit entries cleaned up');
  } catch (error) {
    console.error('Error cleaning up rate limit entries:', error);
  }
};

// Export all rate limiting middleware
module.exports = {
  generalRateLimit,
  authRateLimit,
  paymentRateLimit,
  uploadRateLimit,
  emailRateLimit,
  searchRateLimit,
  speedLimiter,
  createUserRateLimit,
  createRoleBasedRateLimit,
  suspiciousActivityDetection,
  cleanupRateLimitEntries,
  MemoryRateLimitStore
};
