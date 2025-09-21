const bcrypt = require('bcryptjs');
const User = require('../models/User');
const memoryStore = require('../models/memoryStore');
const JWTUtils = require('../utils/jwt');
const emailUtils = require('../utils/email');

/**
 * User Controller - Handles user authentication and profile management
 */
class UserController {
  /**
   * Register a new user
   * POST /register
   */
  static async register(req, res) {
    try {
      const { email, password, firstName, lastName, role } = req.body;

      // Validate input data
      const validation = User.validate({ email, password, firstName, lastName, role });
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }

      // Check if user already exists
      const existingUser = memoryStore.getUserByEmail(email.toLowerCase());
      if (existingUser) {
        return res.status(409).json({
          error: 'User with this email already exists',
          code: 'EMAIL_EXISTS'
        });
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const userData = {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role || 'attendee'
      };

      const user = new User(userData);
      memoryStore.createUser(user);

      // Generate JWT token
      const token = JWTUtils.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // Send welcome email asynchronously
      emailUtils.sendWelcomeEmail(user).catch(error => {
        console.error('Failed to send welcome email:', error);
      });

      res.status(201).json({
        message: 'User registered successfully',
        user: user.toJSON(),
        token,
        expiresIn: '24h'
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Internal server error during registration',
        details: error.message
      });
    }
  }

  /**
   * Login user
   * POST /login
   */
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({
          error: 'Email and password are required',
          code: 'MISSING_CREDENTIALS'
        });
      }

      // Find user by email
      const user = memoryStore.getUserByEmail(email.toLowerCase());
      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account is inactive. Please contact support.',
          code: 'ACCOUNT_INACTIVE'
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Generate JWT token
      const token = JWTUtils.generateToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      res.json({
        message: 'Login successful',
        user: user.toJSON(),
        token,
        expiresIn: '24h'
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Internal server error during login',
        details: error.message
      });
    }
  }

  /**
   * Get user profile
   * GET /profile
   */
  static async getProfile(req, res) {
    try {
      const user = req.user;
      
      // Get user's event registrations
      const registrations = memoryStore.getUserRegistrations(user.id);
      
      res.json({
        user: user.toJSON(),
        registrations: registrations.map(event => event.toJSON()),
        stats: {
          totalRegistrations: registrations.length,
          upcomingEvents: registrations.filter(event => {
            event.updateStatus();
            return event.status === 'upcoming';
          }).length
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        error: 'Failed to get user profile',
        details: error.message
      });
    }
  }

  /**
   * Update user profile
   * PUT /profile
   */
  static async updateProfile(req, res) {
    try {
      const user = req.user;
      const { firstName, lastName, email } = req.body;

      // Validate input
      const updates = {};
      if (firstName) updates.firstName = firstName.trim();
      if (lastName) updates.lastName = lastName.trim();
      if (email) {
        // Check if new email is already taken
        const existingUser = memoryStore.getUserByEmail(email.toLowerCase());
        if (existingUser && existingUser.id !== user.id) {
          return res.status(409).json({
            error: 'Email is already taken by another user',
            code: 'EMAIL_EXISTS'
          });
        }
        updates.email = email.toLowerCase();
      }

      // Update user
      user.update(updates);
      memoryStore.updateUser(user.id, user);

      res.json({
        message: 'Profile updated successfully',
        user: user.toJSON()
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({
        error: 'Failed to update profile',
        details: error.message
      });
    }
  }

  /**
   * Change password
   * PUT /change-password
   */
  static async changePassword(req, res) {
    try {
      const user = req.user;
      const { currentPassword, newPassword } = req.body;

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: 'Current password and new password are required',
          code: 'MISSING_PASSWORDS'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          error: 'New password must be at least 6 characters long',
          code: 'PASSWORD_TOO_SHORT'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          error: 'Current password is incorrect',
          code: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Hash new password
      const saltRounds = 12;
      const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      user.password = hashedNewPassword;
      user.updatedAt = new Date();
      memoryStore.updateUser(user.id, user);

      res.json({
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Failed to change password',
        details: error.message
      });
    }
  }

  /**
   * Get user's event registrations
   * GET /registrations
   */
  static async getUserRegistrations(req, res) {
    try {
      const user = req.user;
      const registrations = memoryStore.getUserRegistrations(user.id);

      // Update event statuses
      registrations.forEach(event => event.updateStatus());

      // Categorize events
      const upcoming = registrations.filter(event => event.status === 'upcoming');
      const ongoing = registrations.filter(event => event.status === 'ongoing');
      const completed = registrations.filter(event => event.status === 'completed');

      res.json({
        registrations: registrations.map(event => event.toJSON()),
        summary: {
          total: registrations.length,
          upcoming: upcoming.length,
          ongoing: ongoing.length,
          completed: completed.length
        },
        events: {
          upcoming: upcoming.map(event => event.toJSON()),
          ongoing: ongoing.map(event => event.toJSON()),
          completed: completed.map(event => event.toJSON())
        }
      });
    } catch (error) {
      console.error('Get registrations error:', error);
      res.status(500).json({
        error: 'Failed to get user registrations',
        details: error.message
      });
    }
  }

  /**
   * Refresh JWT token
   * POST /refresh-token
   */
  static async refreshToken(req, res) {
    try {
      const authHeader = req.header('Authorization');
      const token = JWTUtils.extractTokenFromHeader(authHeader);

      if (!token) {
        return res.status(401).json({
          error: 'No token provided',
          code: 'NO_TOKEN'
        });
      }

      try {
        // Check if token is expired but still valid for refresh
        const decoded = JWTUtils.decodeToken(token);
        if (!decoded) {
          return res.status(401).json({
            error: 'Invalid token',
            code: 'INVALID_TOKEN'
          });
        }

        // Verify user still exists and is active
        const user = memoryStore.getUserById(decoded.userId);
        if (!user || !user.isActive) {
          return res.status(401).json({
            error: 'User not found or inactive',
            code: 'USER_NOT_FOUND'
          });
        }

        // Generate new token
        const newToken = JWTUtils.generateToken({
          userId: user.id,
          email: user.email,
          role: user.role
        });

        res.json({
          message: 'Token refreshed successfully',
          token: newToken,
          expiresIn: '24h'
        });
      } catch (tokenError) {
        return res.status(401).json({
          error: 'Failed to refresh token',
          code: 'REFRESH_FAILED',
          details: tokenError.message
        });
      }
    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(500).json({
        error: 'Failed to refresh token',
        details: error.message
      });
    }
  }

  /**
   * Delete user account
   * DELETE /profile
   */
  static async deleteAccount(req, res) {
    try {
      const user = req.user;
      const { password } = req.body;

      // Verify password before deletion
      if (!password) {
        return res.status(400).json({
          error: 'Password is required to delete account',
          code: 'PASSWORD_REQUIRED'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Incorrect password',
          code: 'INVALID_PASSWORD'
        });
      }

      // Delete user and all associated data
      memoryStore.deleteUser(user.id);

      res.json({
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({
        error: 'Failed to delete account',
        details: error.message
      });
    }
  }
}

module.exports = UserController;
