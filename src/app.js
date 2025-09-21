const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes
const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');

// Import utilities
const emailUtils = require('./utils/email');

const app = express();
const PORT = process.env.PORT || 3000;

/**
 * Security Middleware
 */

// Enable trust proxy for rate limiting behind proxies
app.set('trust proxy', 1);

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Global rate limiting
const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalRateLimit);

/**
 * Middleware
 */

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (exclude during tests)
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  }
  next();
});

/**
 * Routes
 */

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// API documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Virtual Event Management Platform API',
    version: '1.0.0',
    description: 'Backend API for managing virtual events, user registration, and participant management',
    endpoints: {
      authentication: {
        'POST /register': 'Register a new user',
        'POST /login': 'Login user',
        'POST /refresh-token': 'Refresh JWT token'
      },
      users: {
        'GET /profile': 'Get user profile (authenticated)',
        'PUT /profile': 'Update user profile (authenticated)',
        'DELETE /profile': 'Delete user account (authenticated)',
        'PUT /change-password': 'Change password (authenticated)',
        'GET /registrations': 'Get user event registrations (authenticated)'
      },
      events: {
        'GET /events': 'Get all public events',
        'GET /events/:id': 'Get event by ID',
        'POST /events': 'Create new event (organizers only)',
        'PUT /events/:id': 'Update event (organizers only)',
        'DELETE /events/:id': 'Delete event (organizers only)',
        'POST /events/:id/register': 'Register for event (authenticated)',
        'DELETE /events/:id/register': 'Unregister from event (authenticated)',
        'GET /events/my-events': 'Get user\'s organized events (organizers only)',
        'GET /events/:id/participants': 'Get event participants (organizers only)'
      }
    },
    documentation: 'https://github.com/your-username/event-management-api',
    support: 'support@eventmanagement.com'
  });
});

// API routes
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);

// Legacy routes (for backward compatibility)
app.use('/register', userRoutes);
app.use('/login', userRoutes);
app.use('/events', eventRoutes);

/**
 * Error Handling Middleware
 */

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'POST /api/users/register',
      'POST /api/users/login',
      'GET /api/events',
      'POST /api/events',
      'GET /api/events/:id',
      'POST /api/events/:id/register'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle specific error types
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'Invalid JSON in request body',
      code: 'INVALID_JSON'
    });
  }

  if (error.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Request body too large',
      code: 'PAYLOAD_TOO_LARGE'
    });
  }

  // Default error response
  res.status(error.status || 500).json({
    error: error.message || 'Internal server error',
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

/**
 * Graceful Shutdown
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

/**
 * Start Server
 */
const server = app.listen(PORT, async () => {
  console.log(`🚀 Event Management API Server running on port ${PORT}`);
  console.log(`📝 API Documentation: http://localhost:${PORT}`);
  console.log(`🔍 Health Check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Verify email configuration
  try {
    const emailVerified = await emailUtils.verifyTransporter();
    console.log(`📧 Email service: ${emailVerified ? '✅ Connected' : '❌ Not configured'}`);
  } catch (error) {
    console.log('📧 Email service: ❌ Configuration error');
  }
  
  console.log('----------------------------------------');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;
