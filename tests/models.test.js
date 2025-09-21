const User = require('../src/models/User');
const Event = require('../src/models/Event');
const memoryStore = require('../src/models/memoryStore');

describe('Models', () => {
  describe('User Model', () => {
    describe('User validation', () => {
      it('should validate correct user data', () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'attendee'
        };

        const validation = User.validate(userData);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should reject invalid email', () => {
        const userData = {
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        };

        const validation = User.validate(userData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Email must be a valid email address');
      });

      it('should reject short password', () => {
        const userData = {
          email: 'test@example.com',
          password: '123',
          firstName: 'John',
          lastName: 'Doe'
        };

        const validation = User.validate(userData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Password must be at least 6 characters long');
      });

      it('should reject invalid role', () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'invalid-role'
        };

        const validation = User.validate(userData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Role must be either "organizer" or "attendee"');
      });
    });

    describe('User instance methods', () => {
      let user;

      beforeEach(() => {
        user = new User({
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe',
          role: 'organizer'
        });
      });

      it('should return full name', () => {
        expect(user.getFullName()).toBe('John Doe');
      });

      it('should check if user is organizer', () => {
        expect(user.isOrganizer()).toBe(true);
        expect(user.isAttendee()).toBe(false);
      });

      it('should update user data', () => {
        
        user.update({
          firstName: 'Jane',
          lastName: 'Smith'
        });

        expect(user.firstName).toBe('Jane');
        expect(user.lastName).toBe('Smith');
      });

      it('should convert to JSON without password', () => {
        const json = user.toJSON();
        expect(json).not.toHaveProperty('password');
        expect(json).toHaveProperty('email');
        expect(json).toHaveProperty('firstName');
        expect(json).toHaveProperty('id');
      });
    });
  });

  describe('Event Model', () => {
    describe('Event validation', () => {
      it('should validate correct event data', () => {
        const eventData = {
          title: 'Test Event',
          description: 'A test event',
          date: '2025-12-25',
          time: '14:00',
          location: 'Virtual Room',
          organizerId: 'user-123'
        };

        const validation = Event.validate(eventData);
        expect(validation.isValid).toBe(true);
        expect(validation.errors).toHaveLength(0);
      });

      it('should reject past date', () => {
        const eventData = {
          title: 'Test Event',
          description: 'A test event',
          date: '2020-01-01',
          time: '14:00',
          location: 'Virtual Room',
          organizerId: 'user-123'
        };

        const validation = Event.validate(eventData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Event date cannot be in the past');
      });

      it('should reject invalid time format', () => {
        const eventData = {
          title: 'Test Event',
          description: 'A test event',
          date: '2025-12-25',
          time: '25:00', // Invalid time
          location: 'Virtual Room',
          organizerId: 'user-123'
        };

        const validation = Event.validate(eventData);
        expect(validation.isValid).toBe(false);
        expect(validation.errors).toContain('Time must be in HH:MM format');
      });
    });

    describe('Event instance methods', () => {
      let event;

      beforeEach(() => {
        event = new Event({
          title: 'Test Event',
          description: 'A test event',
          date: '2025-12-25',
          time: '14:00',
          duration: 120,
          location: 'Virtual Room',
          maxParticipants: 50,
          organizerId: 'user-123'
        });
      });

      it('should get date and time as combined Date object', () => {
        const dateTime = event.getDateTime();
        expect(dateTime).toBeInstanceOf(Date);
        expect(dateTime.getHours()).toBe(14);
        expect(dateTime.getMinutes()).toBe(0);
      });

      it('should check if event has started', () => {
        // Create an event in the past
        const pastEvent = new Event({
          title: 'Past Event',
          description: 'A past event',
          date: '2020-01-01',
          time: '14:00',
          location: 'Virtual Room',
          organizerId: 'user-123'
        });

        expect(pastEvent.hasStarted()).toBe(true);
        expect(event.hasStarted()).toBe(false);
      });

      it('should check if event has ended', () => {
        // Create an event that has ended
        const endedEvent = new Event({
          title: 'Ended Event',
          description: 'An ended event',
          date: '2020-01-01',
          time: '14:00',
          duration: 60,
          location: 'Virtual Room',
          organizerId: 'user-123'
        });

        expect(endedEvent.hasEnded()).toBe(true);
        expect(event.hasEnded()).toBe(false);
      });

      it('should update event status', () => {
        event.updateStatus();
        expect(event.status).toBe('upcoming');
      });

      it('should check if event is full', () => {
        expect(event.isFull(25)).toBe(false);
        expect(event.isFull(50)).toBe(true);
        expect(event.isFull(51)).toBe(true);

        // Event with no participant limit
        event.maxParticipants = null;
        expect(event.isFull(1000)).toBe(false);
      });

      it('should update event data', () => {
        
        event.update({
          title: 'Updated Event',
          description: 'Updated description'
        });

        expect(event.title).toBe('Updated Event');
        expect(event.description).toBe('Updated description');
      });

      it('should convert to JSON with formatted date', () => {
        const json = event.toJSON();
        expect(json.date).toBe('2025-12-25');
        expect(json).toHaveProperty('title');
        expect(json).toHaveProperty('id');
      });
    });

    describe('Event static methods', () => {
      let events;

      beforeEach(() => {
        events = [
          new Event({
            title: 'Future Event',
            description: 'Future event',
            date: '2025-12-25',
            time: '14:00',
            location: 'Virtual Room',
            organizerId: 'user-123'
          }),
          new Event({
            title: 'Past Event',
            description: 'Past event',
            date: '2020-01-01',
            time: '14:00',
            location: 'Virtual Room',
            organizerId: 'user-123'
          })
        ];
      });

      it('should filter upcoming events', () => {
        const upcoming = Event.filterUpcoming(events);
        expect(upcoming).toHaveLength(1);
        expect(upcoming[0].title).toBe('Future Event');
      });

      it('should filter completed events', () => {
        const completed = Event.filterCompleted(events);
        expect(completed).toHaveLength(1);
        expect(completed[0].title).toBe('Past Event');
      });
    });
  });

  describe('Memory Store', () => {
    beforeEach(() => {
      memoryStore.clear();
    });

    describe('User operations', () => {
      it('should create and retrieve user', () => {
        const user = new User({
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe'
        });

        memoryStore.createUser(user);

        const retrievedUser = memoryStore.getUserById(user.id);
        expect(retrievedUser).toEqual(user);

        const userByEmail = memoryStore.getUserByEmail('test@example.com');
        expect(userByEmail).toEqual(user);
      });

      it('should update user', () => {
        const user = new User({
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe'
        });

        memoryStore.createUser(user);
        
        const updates = { firstName: 'Jane' };
        const updatedUser = memoryStore.updateUser(user.id, updates);
        
        expect(updatedUser.firstName).toBe('Jane');
      });

      it('should delete user and cleanup registrations', () => {
        const user = new User({
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe'
        });

        const event = new Event({
          title: 'Test Event',
          description: 'Test',
          date: '2025-12-25',
          time: '14:00',
          location: 'Virtual Room',
          organizerId: 'organizer-123'
        });

        memoryStore.createUser(user);
        memoryStore.createEvent(event);
        memoryStore.registerUserForEvent(user.id, event.id);

        // Verify registration exists
        expect(memoryStore.isUserRegisteredForEvent(user.id, event.id)).toBe(true);

        // Delete user
        memoryStore.deleteUser(user.id);

        // Verify user is deleted and registration is cleaned up
        expect(memoryStore.getUserById(user.id)).toBeUndefined();
        expect(memoryStore.isUserRegisteredForEvent(user.id, event.id)).toBe(false);
      });
    });

    describe('Event operations', () => {
      it('should create and retrieve event', () => {
        const event = new Event({
          title: 'Test Event',
          description: 'Test',
          date: '2025-12-25',
          time: '14:00',
          location: 'Virtual Room',
          organizerId: 'organizer-123'
        });

        memoryStore.createEvent(event);

        const retrievedEvent = memoryStore.getEventById(event.id);
        expect(retrievedEvent).toEqual(event);
      });

      it('should get events by organizer', () => {
        const event1 = new Event({
          title: 'Event 1',
          description: 'Test',
          date: '2025-12-25',
          time: '14:00',
          location: 'Virtual Room',
          organizerId: 'organizer-123'
        });

        const event2 = new Event({
          title: 'Event 2',
          description: 'Test',
          date: '2025-12-26',
          time: '15:00',
          location: 'Virtual Room',
          organizerId: 'organizer-123'
        });

        const event3 = new Event({
          title: 'Event 3',
          description: 'Test',
          date: '2025-12-27',
          time: '16:00',
          location: 'Virtual Room',
          organizerId: 'other-organizer'
        });

        memoryStore.createEvent(event1);
        memoryStore.createEvent(event2);
        memoryStore.createEvent(event3);

        const organizerEvents = memoryStore.getEventsByOrganizer('organizer-123');
        expect(organizerEvents).toHaveLength(2);
        expect(organizerEvents.map(e => e.title)).toContain('Event 1');
        expect(organizerEvents.map(e => e.title)).toContain('Event 2');
      });
    });

    describe('Registration operations', () => {
      let user, event;

      beforeEach(() => {
        user = new User({
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe'
        });

        event = new Event({
          title: 'Test Event',
          description: 'Test',
          date: '2025-12-25',
          time: '14:00',
          location: 'Virtual Room',
          organizerId: 'organizer-123'
        });

        memoryStore.createUser(user);
        memoryStore.createEvent(event);
      });

      it('should register user for event', () => {
        const success = memoryStore.registerUserForEvent(user.id, event.id);
        expect(success).toBe(true);

        expect(memoryStore.isUserRegisteredForEvent(user.id, event.id)).toBe(true);
        expect(memoryStore.getEventRegistrationCount(event.id)).toBe(1);

        const userRegistrations = memoryStore.getUserRegistrations(user.id);
        expect(userRegistrations).toHaveLength(1);
        expect(userRegistrations[0].id).toBe(event.id);

        const eventRegistrations = memoryStore.getEventRegistrations(event.id);
        expect(eventRegistrations).toHaveLength(1);
        expect(eventRegistrations[0].id).toBe(user.id);
      });

      it('should not register user twice for same event', () => {
        memoryStore.registerUserForEvent(user.id, event.id);
        const secondAttempt = memoryStore.registerUserForEvent(user.id, event.id);
        
        expect(secondAttempt).toBe(false);
        expect(memoryStore.getEventRegistrationCount(event.id)).toBe(1);
      });

      it('should unregister user from event', () => {
        memoryStore.registerUserForEvent(user.id, event.id);
        expect(memoryStore.isUserRegisteredForEvent(user.id, event.id)).toBe(true);

        memoryStore.unregisterUserFromEvent(user.id, event.id);
        expect(memoryStore.isUserRegisteredForEvent(user.id, event.id)).toBe(false);
        expect(memoryStore.getEventRegistrationCount(event.id)).toBe(0);
      });

      it('should handle non-existent user or event registration', () => {
        const success = memoryStore.registerUserForEvent('non-existent', event.id);
        expect(success).toBe(false);

        const success2 = memoryStore.registerUserForEvent(user.id, 'non-existent');
        expect(success2).toBe(false);
      });
    });

    describe('Statistics operations', () => {
      it('should return correct statistics', () => {
        expect(memoryStore.getTotalUsers()).toBe(0);
        expect(memoryStore.getTotalEvents()).toBe(0);
        expect(memoryStore.getTotalRegistrations()).toBe(0);

        const user = new User({
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe'
        });

        const event = new Event({
          title: 'Test Event',
          description: 'Test',
          date: '2025-12-25',
          time: '14:00',
          location: 'Virtual Room',
          organizerId: 'organizer-123'
        });

        memoryStore.createUser(user);
        memoryStore.createEvent(event);
        memoryStore.registerUserForEvent(user.id, event.id);

        expect(memoryStore.getTotalUsers()).toBe(1);
        expect(memoryStore.getTotalEvents()).toBe(1);
        expect(memoryStore.getTotalRegistrations()).toBe(1);
      });
    });

    describe('Clear operation', () => {
      it('should clear all data', () => {
        const user = new User({
          email: 'test@example.com',
          password: 'hashedpassword',
          firstName: 'John',
          lastName: 'Doe'
        });

        memoryStore.createUser(user);
        expect(memoryStore.getTotalUsers()).toBe(1);

        memoryStore.clear();
        expect(memoryStore.getTotalUsers()).toBe(0);
        expect(memoryStore.getTotalEvents()).toBe(0);
        expect(memoryStore.getTotalRegistrations()).toBe(0);
      });
    });
  });
});
