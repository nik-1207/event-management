const JWTUtils = require('../utils/jwt');
const memoryStore = require('../models/memoryStore');

/**
 * Authentication middleware
 */
const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
    }

    try {
      const decoded = JWTUtils.verifyToken(token);
      
      // Get user from memory store
      const user = memoryStore.getUserById(decoded.userId);
      if (!user) {
        return res.status(401).json({ 
          error: 'Access denied. User not found.',
          code: 'USER_NOT_FOUND'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({ 
          error: 'Access denied. User account is inactive.',
          code: 'USER_INACTIVE'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (tokenError) {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token.',
        code: 'INVALID_TOKEN',
        details: tokenError.message
      });
    }
  } catch (error) {
    res.status(500).json({ 
      error: 'Server error during authentication.',
      details: error.message 
    });
  }
};

/**
 * Authorization middleware for organizers only
 */
const requireOrganizer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.isOrganizer()) {
    return res.status(403).json({ 
      error: 'Access denied. Organizer privileges required.',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }

  next();
};

/**
 * Authorization middleware for attendees only
 */
const requireAttendee = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required.',
      code: 'AUTH_REQUIRED'
    });
  }

  if (!req.user.isAttendee()) {
    return res.status(403).json({ 
      error: 'Access denied. Attendee privileges required.',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }

  next();
};

/**
 * Authorization middleware to check if user owns the resource
 */
const requireOwnership = (resourceType) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required.',
        code: 'AUTH_REQUIRED'
      });
    }

    const resourceId = req.params.id;
    
    if (resourceType === 'event') {
      const event = memoryStore.getEventById(resourceId);
      if (!event) {
        return res.status(404).json({ 
          error: 'Event not found.',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      if (event.organizerId !== req.user.id) {
        return res.status(403).json({ 
          error: 'Access denied. You can only modify your own events.',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      req.event = event;
    } else if (resourceType === 'user') {
      if (resourceId !== req.user.id) {
        return res.status(403).json({ 
          error: 'Access denied. You can only modify your own profile.',
          code: 'OWNERSHIP_REQUIRED'
        });
      }
    }

    next();
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    const token = JWTUtils.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = JWTUtils.verifyToken(token);
        const user = memoryStore.getUserById(decoded.userId);
        if (user && user.isActive) {
          req.user = user;
        }
      } catch (tokenError) {
        // Ignore token errors for optional auth
      }
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Rate limiting middleware (simple implementation)
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request log for this IP
    if (!requests.has(ip)) {
      requests.set(ip, []);
    }

    const requestLog = requests.get(ip);
    
    // Remove old requests outside the window
    const recentRequests = requestLog.filter(time => time > windowStart);
    requests.set(ip, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current request
    recentRequests.push(now);
    requests.set(ip, recentRequests);

    next();
  };
};

module.exports = {
  auth,
  requireOrganizer,
  requireAttendee,
  requireOwnership,
  optionalAuth,
  rateLimit
};
