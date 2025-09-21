/**
 * In-memory data store for the virtual event management platform
 */

class MemoryStore {
  constructor() {
    this.users = new Map(); // userId -> user object
    this.events = new Map(); // eventId -> event object
    this.eventRegistrations = new Map(); // eventId -> Set of userIds
    this.userRegistrations = new Map(); // userId -> Set of eventIds
  }

  // User methods
  createUser(user) {
    this.users.set(user.id, user);
    this.userRegistrations.set(user.id, new Set());
    return user;
  }

  getUserById(id) {
    return this.users.get(id);
  }

  getUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  updateUser(id, updates) {
    const user = this.users.get(id);
    if (user) {
      Object.assign(user, updates);
      this.users.set(id, user);
      return user;
    }
    return null;
  }

  deleteUser(id) {
    const user = this.users.get(id);
    if (user) {
      this.users.delete(id);
      this.userRegistrations.delete(id);
      
      // Remove user from all event registrations
      for (const [eventId, registeredUsers] of this.eventRegistrations.entries()) {
        registeredUsers.delete(id);
      }
      
      return user;
    }
    return null;
  }

  // Event methods
  createEvent(event) {
    this.events.set(event.id, event);
    this.eventRegistrations.set(event.id, new Set());
    return event;
  }

  getEventById(id) {
    return this.events.get(id);
  }

  getAllEvents() {
    return Array.from(this.events.values());
  }

  getEventsByOrganizer(organizerId) {
    return Array.from(this.events.values()).filter(event => event.organizerId === organizerId);
  }

  updateEvent(id, updates) {
    const event = this.events.get(id);
    if (event) {
      Object.assign(event, updates);
      this.events.set(id, event);
      return event;
    }
    return null;
  }

  deleteEvent(id) {
    const event = this.events.get(id);
    if (event) {
      this.events.delete(id);
      
      // Remove all registrations for this event
      const registeredUsers = this.eventRegistrations.get(id) || new Set();
      for (const userId of registeredUsers) {
        const userEvents = this.userRegistrations.get(userId);
        if (userEvents) {
          userEvents.delete(id);
        }
      }
      this.eventRegistrations.delete(id);
      
      return event;
    }
    return null;
  }

  // Registration methods
  registerUserForEvent(userId, eventId) {
    const user = this.users.get(userId);
    const event = this.events.get(eventId);
    
    if (!user || !event) {
      return false;
    }

    // Check if user is already registered
    const eventRegistrations = this.eventRegistrations.get(eventId);
    if (eventRegistrations && eventRegistrations.has(userId)) {
      return false; // Already registered
    }

    // Add user to event registrations
    if (!this.eventRegistrations.has(eventId)) {
      this.eventRegistrations.set(eventId, new Set());
    }
    this.eventRegistrations.get(eventId).add(userId);

    // Add event to user registrations
    if (!this.userRegistrations.has(userId)) {
      this.userRegistrations.set(userId, new Set());
    }
    this.userRegistrations.get(userId).add(eventId);

    return true;
  }

  unregisterUserFromEvent(userId, eventId) {
    const eventRegistrations = this.eventRegistrations.get(eventId);
    const userRegistrations = this.userRegistrations.get(userId);

    if (eventRegistrations) {
      eventRegistrations.delete(userId);
    }

    if (userRegistrations) {
      userRegistrations.delete(eventId);
    }

    return true;
  }

  getEventRegistrations(eventId) {
    const userIds = this.eventRegistrations.get(eventId) || new Set();
    return Array.from(userIds).map(userId => this.users.get(userId)).filter(Boolean);
  }

  getUserRegistrations(userId) {
    const eventIds = this.userRegistrations.get(userId) || new Set();
    return Array.from(eventIds).map(eventId => this.events.get(eventId)).filter(Boolean);
  }

  isUserRegisteredForEvent(userId, eventId) {
    const eventRegistrations = this.eventRegistrations.get(eventId);
    return eventRegistrations ? eventRegistrations.has(userId) : false;
  }

  getEventRegistrationCount(eventId) {
    const registrations = this.eventRegistrations.get(eventId);
    return registrations ? registrations.size : 0;
  }

  // Statistics methods
  getTotalUsers() {
    return this.users.size;
  }

  getTotalEvents() {
    return this.events.size;
  }

  getTotalRegistrations() {
    let total = 0;
    for (const registrations of this.eventRegistrations.values()) {
      total += registrations.size;
    }
    return total;
  }

  // Clear all data (useful for testing)
  clear() {
    this.users.clear();
    this.events.clear();
    this.eventRegistrations.clear();
    this.userRegistrations.clear();
  }
}

// Create a singleton instance
const memoryStore = new MemoryStore();

module.exports = memoryStore;
