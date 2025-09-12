const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss');
const validator = require('validator');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Security headers middleware
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'https://afroasiaconnect.com',
      'https://www.afroasiaconnect.com',
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN
    ].filter(Boolean);

    console.log('[CORS] Request origin:', origin);
    console.log('[CORS] Allowed origins:', allowedOrigins);

    if (!origin || allowedOrigins.includes(origin)) {
      console.log('[CORS] Origin allowed');
      callback(null, true);
    } else {
      console.log('[CORS] Origin rejected:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control', 'Accept', 'Origin', 'User-Agent', 'DNT', 'If-Modified-Since', 'Keep-Alive', 'X-Requested-With', 'If-None-Match']
};

// Input sanitization middleware
const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }

    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        // XSS protection
        sanitized[key] = xss(value, {
          whiteList: {}, // No HTML tags allowed
          stripIgnoreTag: true,
          stripIgnoreTagBody: ['script']
        });
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  };

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// Input validation middleware
const validateInput = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Invalid input data',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// SQL injection protection
const sqlInjectionProtection = (req, res, next) => {
  const checkForSQLInjection = (value) => {
    if (typeof value !== 'string') return false;
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i,
      /(--|\/\*|\*\/|;)/,
      /(\b(WAITFOR|DELAY)\b)/i,
      /(\b(XP_|SP_)\w+)/i
    ];

    return sqlPatterns.some(pattern => pattern.test(value));
  };

  const checkObject = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return checkForSQLInjection(obj);
    }

    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }

    return Object.values(obj).some(checkObject);
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    console.warn('🚨 SQL injection attempt detected:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      params: req.params
    });

    return res.status(400).json({
      error: 'Invalid request format'
    });
  }

  next();
};

// Request size limiting
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    if (contentLength && parseInt(contentLength) > parseSize(maxSize)) {
      return res.status(413).json({
        error: 'Request entity too large'
      });
    }
    next();
  };
};

// Helper function to parse size strings
const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toString().toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) return 0;
  return parseFloat(match[1]) * (units[match[2]] || units.b);
};

// IP whitelist/blacklist middleware
const ipFilter = async (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;

  try {
    // Check if IP is blacklisted
    const blacklistedIP = await prisma.blacklistedIP.findUnique({
      where: { ip }
    });

    if (blacklistedIP && blacklistedIP.isActive) {
      console.warn('🚫 Blocked request from blacklisted IP:', ip);
      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Log IP access for monitoring
    await prisma.ipAccess.upsert({
      where: { ip },
      update: {
        lastAccess: new Date(),
        accessCount: { increment: 1 }
      },
      create: {
        ip,
        firstAccess: new Date(),
        lastAccess: new Date(),
        accessCount: 1
      }
    });

    next();
  } catch (error) {
    console.error('IP filter error:', error);
    next();
  }
};

// Honeypot middleware (trap for bots)
const honeypot = (req, res, next) => {
  // Check for honeypot field in forms
  if (req.body && req.body.website) {
    console.warn('🍯 Honeypot triggered:', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      honeypotValue: req.body.website
    });

    // Log suspicious activity
    prisma.securityAlert.create({
      data: {
        type: 'HONEYPOT_TRIGGERED',
        description: 'Bot detected via honeypot field',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        severity: 'MEDIUM'
      }
    }).catch(console.error);

    return res.status(400).json({
      error: 'Invalid form submission'
    });
  }

  next();
};

// Request fingerprinting for bot detection
const requestFingerprinting = async (req, res, next) => {
  const fingerprint = {
    userAgent: req.get('User-Agent') || '',
    acceptLanguage: req.get('Accept-Language') || '',
    acceptEncoding: req.get('Accept-Encoding') || '',
    connection: req.get('Connection') || '',
    ip: req.ip
  };

  // Simple bot detection patterns
  const botPatterns = [
    /bot|crawler|spider|scraper/i,
    /curl|wget|python|java|go-http/i,
    /^$/  // Empty user agent
  ];

  const isBot = botPatterns.some(pattern => 
    pattern.test(fingerprint.userAgent)
  );

  if (isBot) {
    console.warn('🤖 Bot detected:', fingerprint);
    
    // Log bot activity
    await prisma.securityAlert.create({
      data: {
        type: 'BOT_DETECTED',
        description: 'Automated bot activity detected',
        ip: req.ip,
        userAgent: fingerprint.userAgent,
        severity: 'LOW',
        metadata: fingerprint
      }
    }).catch(console.error);

    // Allow bots but with restrictions
    req.isBot = true;
  }

  req.fingerprint = fingerprint;
  next();
};

// Security monitoring middleware
const securityMonitoring = async (req, res, next) => {
  const startTime = Date.now();

  // Override res.json to capture response data
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Log security-relevant requests
    if (req.path.includes('/auth') || req.path.includes('/admin') || req.path.includes('/payment')) {
      prisma.securityLog.create({
        data: {
          method: req.method,
          path: req.path,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          userId: req.user?.id || null,
          statusCode: res.statusCode,
          responseTime,
          timestamp: new Date()
        }
      }).catch(console.error);
    }

    return originalJson.call(this, data);
  };

  next();
};

// Content type validation
const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    if (req.method === 'GET' || req.method === 'DELETE') {
      return next();
    }

    const contentType = req.get('Content-Type');
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        error: 'Unsupported content type'
      });
    }

    next();
  };
};

module.exports = {
  securityHeaders,
  corsOptions,
  sanitizeInput,
  validateInput,
  sqlInjectionProtection,
  requestSizeLimit,
  ipFilter,
  honeypot,
  requestFingerprinting,
  securityMonitoring,
  validateContentType
};
