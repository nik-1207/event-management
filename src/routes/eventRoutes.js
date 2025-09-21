const express = require('express');
const EventController = require('../controllers/eventController');
const { auth, requireOrganizer, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Public Event Routes (no authentication required)
 */

// Get all public events (with optional authentication for enhanced data)
// GET /events
router.get('/', optionalAuth, EventController.getAllEvents);

// Get single event by ID (public events only, unless authenticated)
// GET /events/:id
router.get('/:id', optionalAuth, EventController.getEventById);

/**
 * Protected Event Routes
 * All routes below require authentication
 */
router.use(auth);

// Get events organized by current user
// GET /my-events
router.get('/my-events', EventController.getMyEvents);

// Register for an event
// POST /events/:id/register
router.post('/:id/register', EventController.registerForEvent);

// Unregister from an event
// DELETE /events/:id/register
router.delete('/:id/register', EventController.unregisterFromEvent);

// Get event participants (organizers only)
// GET /events/:id/participants
router.get('/:id/participants', EventController.getEventParticipants);

/**
 * Organizer-only Routes
 * All routes below require organizer privileges
 */

// Create new event (organizers only)
// POST /events
router.post('/', requireOrganizer, EventController.createEvent);

// Update event (organizers only, must own the event)
// PUT /events/:id
router.put('/:id', requireOrganizer, EventController.updateEvent);

// Delete event (organizers only, must own the event)
// DELETE /events/:id
router.delete('/:id', requireOrganizer, EventController.deleteEvent);

module.exports = router;
