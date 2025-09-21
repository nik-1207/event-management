const Event = require('../models/Event');
const memoryStore = require('../models/memoryStore');
const emailUtils = require('../utils/email');

/**
 * Event Controller - Handles event CRUD operations
 */
class EventController {
  /**
   * Get all events
   * GET /events
   */
  static async getAllEvents(req, res) {
    try {
      const { 
        status, 
        category, 
        organizer, 
        date, 
        limit = 50, 
        offset = 0,
        search 
      } = req.query;

      let events = memoryStore.getAllEvents();

      // Update event statuses
      events.forEach(event => event.updateStatus());

      // Apply filters
      if (status) {
        events = events.filter(event => event.status === status);
      }

      if (category) {
        events = events.filter(event => 
          event.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (organizer) {
        events = events.filter(event => event.organizerId === organizer);
      }

      if (date) {
        const filterDate = new Date(date).toDateString();
        events = events.filter(event => 
          event.date.toDateString() === filterDate
        );
      }

      if (search) {
        const searchTerm = search.toLowerCase();
        events = events.filter(event =>
          event.title.toLowerCase().includes(searchTerm) ||
          event.description.toLowerCase().includes(searchTerm) ||
          event.category.toLowerCase().includes(searchTerm)
        );
      }

      // Filter public events only (unless user is authenticated and viewing their own events)
      if (!req.user) {
        events = events.filter(event => event.isPublic && event.isActive);
      } else {
        // Authenticated users can see public events and their own events
        events = events.filter(event => 
          (event.isPublic && event.isActive) || 
          event.organizerId === req.user.id
        );
      }

      // Sort by date
      events.sort((a, b) => a.getDateTime() - b.getDateTime());

      // Apply pagination
      const total = events.length;
      const paginatedEvents = events.slice(
        parseInt(offset), 
        parseInt(offset) + parseInt(limit)
      );

      // Add registration count and user registration status
      const eventsWithDetails = paginatedEvents.map(event => {
        const eventData = event.toJSON();
        eventData.registrationCount = memoryStore.getEventRegistrationCount(event.id);
        eventData.isRegistered = req.user ? 
          memoryStore.isUserRegisteredForEvent(req.user.id, event.id) : false;
        eventData.isFull = event.isFull(eventData.registrationCount);
        return eventData;
      });

      res.json({
        events: eventsWithDetails,
        pagination: {
          total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        filters: {
          status,
          category,
          organizer,
          date,
          search
        }
      });
    } catch (error) {
      console.error('Get all events error:', error);
      res.status(500).json({
        error: 'Failed to retrieve events',
        details: error.message
      });
    }
  }

  /**
   * Get single event by ID
   * GET /events/:id
   */
  static async getEventById(req, res) {
    try {
      const { id } = req.params;
      const event = memoryStore.getEventById(id);

      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          code: 'EVENT_NOT_FOUND'
        });
      }

      // Check if user can view this event
      if (!event.isPublic && (!req.user || req.user.id !== event.organizerId)) {
        return res.status(403).json({
          error: 'Access denied. This is a private event.',
          code: 'PRIVATE_EVENT'
        });
      }

      // Update event status
      event.updateStatus();

      // Get event details
      const eventData = event.toJSON();
      eventData.registrationCount = memoryStore.getEventRegistrationCount(event.id);
      eventData.isRegistered = req.user ? 
        memoryStore.isUserRegisteredForEvent(req.user.id, event.id) : false;
      eventData.isFull = event.isFull(eventData.registrationCount);

      // Get organizer details
      const organizer = memoryStore.getUserById(event.organizerId);
      if (organizer) {
        eventData.organizer = {
          id: organizer.id,
          name: organizer.getFullName(),
          email: organizer.email
        };
      }

      // If user is the organizer, include participant list
      if (req.user && req.user.id === event.organizerId) {
        const participants = memoryStore.getEventRegistrations(event.id);
        eventData.participants = participants.map(participant => ({
          id: participant.id,
          name: participant.getFullName(),
          email: participant.email,
          registeredAt: participant.createdAt
        }));
      }

      res.json({
        event: eventData
      });
    } catch (error) {
      console.error('Get event by ID error:', error);
      res.status(500).json({
        error: 'Failed to retrieve event',
        details: error.message
      });
    }
  }

  /**
   * Create new event
   * POST /events
   */
  static async createEvent(req, res) {
    try {
      const organizer = req.user;

      if (!organizer.isOrganizer()) {
        return res.status(403).json({
          error: 'Only organizers can create events',
          code: 'INSUFFICIENT_PRIVILEGES'
        });
      }

      const eventData = {
        ...req.body,
        organizerId: organizer.id
      };

      // Validate event data
      const validation = Event.validate(eventData);
      if (!validation.isValid) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.errors
        });
      }

      // Create event
      const event = new Event(eventData);
      memoryStore.createEvent(event);

      // Send confirmation email to organizer
      emailUtils.sendEventCreationEmail(organizer, event).catch(error => {
        console.error('Failed to send event creation email:', error);
      });

      res.status(201).json({
        message: 'Event created successfully',
        event: event.toJSON()
      });
    } catch (error) {
      console.error('Create event error:', error);
      res.status(500).json({
        error: 'Failed to create event',
        details: error.message
      });
    }
  }

  /**
   * Update event
   * PUT /events/:id
   */
  static async updateEvent(req, res) {
    try {
      const { id } = req.params;
      const event = memoryStore.getEventById(id);

      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          code: 'EVENT_NOT_FOUND'
        });
      }

      // Check ownership
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({
          error: 'You can only update your own events',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      // Validate update data
      const updates = req.body;
      if (updates.date || updates.time) {
        const updatedEventData = { ...event, ...updates };
        const validation = Event.validate(updatedEventData);
        if (!validation.isValid) {
          return res.status(400).json({
            error: 'Validation failed',
            details: validation.errors
          });
        }
      }

      // Update event
      event.update(updates);
      memoryStore.updateEvent(id, event);

      res.json({
        message: 'Event updated successfully',
        event: event.toJSON()
      });
    } catch (error) {
      console.error('Update event error:', error);
      res.status(500).json({
        error: 'Failed to update event',
        details: error.message
      });
    }
  }

  /**
   * Delete event
   * DELETE /events/:id
   */
  static async deleteEvent(req, res) {
    try {
      const { id } = req.params;
      const event = memoryStore.getEventById(id);

      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          code: 'EVENT_NOT_FOUND'
        });
      }

      // Check ownership
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({
          error: 'You can only delete your own events',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      // Get registered participants before deletion
      const participants = memoryStore.getEventRegistrations(id);

      // Delete event
      memoryStore.deleteEvent(id);

      // Notify participants about event cancellation (async)
      participants.forEach(participant => {
        // This would typically send a cancellation email
        console.log(`Event cancelled - would notify ${participant.email}`);
      });

      res.json({
        message: 'Event deleted successfully',
        participantsNotified: participants.length
      });
    } catch (error) {
      console.error('Delete event error:', error);
      res.status(500).json({
        error: 'Failed to delete event',
        details: error.message
      });
    }
  }

  /**
   * Register user for event
   * POST /events/:id/register
   */
  static async registerForEvent(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const event = memoryStore.getEventById(id);
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          code: 'EVENT_NOT_FOUND'
        });
      }

      // Check if event is public or user has access
      if (!event.isPublic && event.organizerId !== user.id) {
        return res.status(403).json({
          error: 'This is a private event',
          code: 'PRIVATE_EVENT'
        });
      }

      // Check if event is still active
      if (!event.isActive) {
        return res.status(400).json({
          error: 'Event is not active',
          code: 'EVENT_INACTIVE'
        });
      }

      // Update event status
      event.updateStatus();

      // Check if event has already started or ended
      if (event.status === 'completed') {
        return res.status(400).json({
          error: 'Cannot register for completed events',
          code: 'EVENT_COMPLETED'
        });
      }

      // Check if user is already registered
      if (memoryStore.isUserRegisteredForEvent(user.id, id)) {
        return res.status(409).json({
          error: 'You are already registered for this event',
          code: 'ALREADY_REGISTERED'
        });
      }

      // Check if event is full
      const currentRegistrations = memoryStore.getEventRegistrationCount(id);
      if (event.isFull(currentRegistrations)) {
        return res.status(400).json({
          error: 'Event is full',
          code: 'EVENT_FULL',
          maxParticipants: event.maxParticipants,
          currentRegistrations
        });
      }

      // Register user for event
      const success = memoryStore.registerUserForEvent(user.id, id);
      if (!success) {
        return res.status(500).json({
          error: 'Failed to register for event',
          code: 'REGISTRATION_FAILED'
        });
      }

      // Send confirmation email
      emailUtils.sendEventRegistrationEmail(user, event).catch(error => {
        console.error('Failed to send registration email:', error);
      });

      res.status(201).json({
        message: 'Successfully registered for event',
        event: event.toJSON(),
        registrationCount: currentRegistrations + 1
      });
    } catch (error) {
      console.error('Register for event error:', error);
      res.status(500).json({
        error: 'Failed to register for event',
        details: error.message
      });
    }
  }

  /**
   * Unregister user from event
   * DELETE /events/:id/register
   */
  static async unregisterFromEvent(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const event = memoryStore.getEventById(id);
      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          code: 'EVENT_NOT_FOUND'
        });
      }

      // Check if user is registered
      if (!memoryStore.isUserRegisteredForEvent(user.id, id)) {
        return res.status(400).json({
          error: 'You are not registered for this event',
          code: 'NOT_REGISTERED'
        });
      }

      // Check if event has already started
      event.updateStatus();
      if (event.status === 'ongoing' || event.status === 'completed') {
        return res.status(400).json({
          error: 'Cannot unregister from events that have started or completed',
          code: 'EVENT_STARTED'
        });
      }

      // Unregister user
      memoryStore.unregisterUserFromEvent(user.id, id);

      res.json({
        message: 'Successfully unregistered from event',
        event: event.toJSON()
      });
    } catch (error) {
      console.error('Unregister from event error:', error);
      res.status(500).json({
        error: 'Failed to unregister from event',
        details: error.message
      });
    }
  }

  /**
   * Get events organized by current user
   * GET /events/my-events
   */
  static async getMyEvents(req, res) {
    try {
      const organizer = req.user;

      if (!organizer.isOrganizer()) {
        return res.status(403).json({
          error: 'Only organizers can view organized events',
          code: 'INSUFFICIENT_PRIVILEGES'
        });
      }

      const events = memoryStore.getEventsByOrganizer(organizer.id);

      // Update event statuses and add registration counts
      const eventsWithDetails = events.map(event => {
        event.updateStatus();
        const eventData = event.toJSON();
        eventData.registrationCount = memoryStore.getEventRegistrationCount(event.id);
        eventData.participants = memoryStore.getEventRegistrations(event.id).map(user => ({
          id: user.id,
          name: user.getFullName(),
          email: user.email
        }));
        return eventData;
      });

      // Sort by date
      eventsWithDetails.sort((a, b) => new Date(a.date) - new Date(b.date));

      res.json({
        events: eventsWithDetails,
        summary: {
          total: eventsWithDetails.length,
          upcoming: eventsWithDetails.filter(e => e.status === 'upcoming').length,
          ongoing: eventsWithDetails.filter(e => e.status === 'ongoing').length,
          completed: eventsWithDetails.filter(e => e.status === 'completed').length,
          totalRegistrations: eventsWithDetails.reduce((sum, e) => sum + e.registrationCount, 0)
        }
      });
    } catch (error) {
      console.error('Get my events error:', error);
      res.status(500).json({
        error: 'Failed to retrieve your events',
        details: error.message
      });
    }
  }

  /**
   * Get event participants (organizers only)
   * GET /events/:id/participants
   */
  static async getEventParticipants(req, res) {
    try {
      const { id } = req.params;
      const event = memoryStore.getEventById(id);

      if (!event) {
        return res.status(404).json({
          error: 'Event not found',
          code: 'EVENT_NOT_FOUND'
        });
      }

      // Check if user is the organizer
      if (event.organizerId !== req.user.id) {
        return res.status(403).json({
          error: 'Only event organizers can view participant lists',
          code: 'OWNERSHIP_REQUIRED'
        });
      }

      const participants = memoryStore.getEventRegistrations(id);
      
      res.json({
        event: {
          id: event.id,
          title: event.title,
          date: event.date.toISOString().split('T')[0],
          time: event.time
        },
        participants: participants.map(participant => ({
          id: participant.id,
          name: participant.getFullName(),
          email: participant.email,
          role: participant.role,
          registeredAt: participant.createdAt
        })),
        count: participants.length,
        maxParticipants: event.maxParticipants
      });
    } catch (error) {
      console.error('Get event participants error:', error);
      res.status(500).json({
        error: 'Failed to retrieve event participants',
        details: error.message
      });
    }
  }
}

module.exports = EventController;
