const jwt = require('jsonwebtoken');

// Use environment variable or default secret (in production, always use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

/**
 * JWT utility functions
 */
class JWTUtils {
  /**
   * Generate a JWT token
   * @param {Object} payload - The payload to include in the token
   * @returns {string} - The generated JWT token
   */
  static generateToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'event-management-api'
    });
  }

  /**
   * Verify and decode a JWT token
   * @param {string} token - The JWT token to verify
   * @returns {Object} - The decoded payload
   * @throws {Error} - If token is invalid or expired
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      } else if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  /**
   * Decode a JWT token without verification (useful for getting expired token data)
   * @param {string} token - The JWT token to decode
   * @returns {Object} - The decoded payload
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Get token from Authorization header
   * @param {string} authHeader - The Authorization header value
   * @returns {string|null} - The extracted token or null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    // Check if it's a Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  /**
   * Check if token is expired
   * @param {string} token - The JWT token to check
   * @returns {boolean} - True if token is expired
   */
  static isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return true;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get time until token expires
   * @param {string} token - The JWT token
   * @returns {number} - Seconds until expiration, or 0 if expired/invalid
   */
  static getTimeUntilExpiry(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) {
        return 0;
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = decoded.exp - currentTime;
      return Math.max(0, timeUntilExpiry);
    } catch (error) {
      return 0;
    }
  }

  /**
   * Refresh token (generate new token with same payload but extended expiry)
   * @param {string} token - The JWT token to refresh
   * @returns {string} - The new JWT token
   * @throws {Error} - If token is invalid
   */
  static refreshToken(token) {
    try {
      const decoded = this.verifyToken(token);
      // Remove standard JWT claims
      const { iat, exp, iss, ...payload } = decoded;
      return this.generateToken(payload);
    } catch (error) {
      throw new Error('Cannot refresh invalid token');
    }
  }
}

module.exports = JWTUtils;
