const express = require('express');
const UserController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Authentication Routes
 */

// Register new user
// POST /register
router.post('/register', UserController.register);

// Login user
// POST /login
router.post('/login', UserController.login);

// Refresh JWT token
// POST /refresh-token
router.post('/refresh-token', UserController.refreshToken);

/**
 * Protected User Profile Routes
 * All routes below require authentication
 */
router.use(auth);

// Get user profile
// GET /profile
router.get('/profile', UserController.getProfile);

// Update user profile
// PUT /profile
router.put('/profile', UserController.updateProfile);

// Delete user account
// DELETE /profile
router.delete('/profile', UserController.deleteAccount);

// Change password
// PUT /change-password
router.put('/change-password', UserController.changePassword);

// Get user's event registrations
// GET /registrations
router.get('/registrations', UserController.getUserRegistrations);

module.exports = router;
