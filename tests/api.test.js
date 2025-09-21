const request = require('supertest');
const app = require('../src/app');
const memoryStore = require('../src/models/memoryStore');

describe('Virtual Event Management API', () => {
  let userToken;
  let organizerToken;
  let userId;
  let organizerId;
  let eventId;

  beforeEach(async () => {
    // Clear memory store before each test
    memoryStore.clear();
  });

  describe('Authentication Endpoints', () => {
    describe('POST /api/users/register', () => {
      it('should register a new attendee user', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
          role: 'attendee'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'User registered successfully');
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('token');
        expect(response.body.user.email).toBe(userData.email);
        expect(response.body.user.role).toBe('attendee');
        expect(response.body.user).not.toHaveProperty('password');

        userToken = response.body.token;
        userId = response.body.user.id;
      });

      it('should register a new organizer user', async () => {
        const userData = {
          email: 'organizer@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'organizer'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData)
          .expect(201);

        expect(response.body.user.role).toBe('organizer');
        organizerToken = response.body.token;
        organizerId = response.body.user.id;
      });

      it('should fail with invalid email', async () => {
        const userData = {
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body).toHaveProperty('error', 'Validation failed');
        expect(response.body.details).toContain('Email must be a valid email address');
      });

      it('should fail with duplicate email', async () => {
        const userData = {
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        };

        // Register first user
        await request(app)
          .post('/api/users/register')
          .send(userData)
          .expect(201);

        // Try to register with same email
        const response = await request(app)
          .post('/api/users/register')
          .send(userData)
          .expect(409);

        expect(response.body.code).toBe('EMAIL_EXISTS');
      });

      it('should fail with short password', async () => {
        const userData = {
          email: 'test@example.com',
          password: '123',
          firstName: 'John',
          lastName: 'Doe'
        };

        const response = await request(app)
          .post('/api/users/register')
          .send(userData)
          .expect(400);

        expect(response.body.details).toContain('Password must be at least 6 characters long');
      });
    });

    describe('POST /api/users/login', () => {
      beforeEach(async () => {
        // Register a test user first
        await request(app)
          .post('/api/users/register')
          .send({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'John',
            lastName: 'Doe'
          });
      });

      it('should login with valid credentials', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Login successful');
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe('test@example.com');
      });

      it('should fail with invalid email', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            email: 'nonexistent@example.com',
            password: 'password123'
          })
          .expect(401);

        expect(response.body.code).toBe('INVALID_CREDENTIALS');
      });

      it('should fail with invalid password', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
          .expect(401);

        expect(response.body.code).toBe('INVALID_CREDENTIALS');
      });

      it('should fail with missing credentials', async () => {
        const response = await request(app)
          .post('/api/users/login')
          .send({})
          .expect(400);

        expect(response.body.code).toBe('MISSING_CREDENTIALS');
      });
    });
  });

  describe('User Profile Endpoints', () => {
    beforeEach(async () => {
      // Register and login a test user
      const registerResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe'
        });

      userToken = registerResponse.body.token;
      userId = registerResponse.body.user.id;
    });

    describe('GET /api/users/profile', () => {
      it('should get user profile with authentication', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('registrations');
        expect(response.body.user.email).toBe('test@example.com');
      });

      it('should fail without authentication', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .expect(401);

        expect(response.body.code).toBe('NO_TOKEN');
      });

      it('should fail with invalid token', async () => {
        const response = await request(app)
          .get('/api/users/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        expect(response.body.code).toBe('INVALID_TOKEN');
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should update user profile', async () => {
        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            firstName: 'Jane',
            lastName: 'Updated'
          })
          .expect(200);

        expect(response.body.user.firstName).toBe('Jane');
        expect(response.body.user.lastName).toBe('Updated');
      });

      it('should fail to update with duplicate email', async () => {
        // Register another user
        await request(app)
          .post('/api/users/register')
          .send({
            email: 'other@example.com',
            password: 'password123',
            firstName: 'Other',
            lastName: 'User'
          });

        const response = await request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            email: 'other@example.com'
          })
          .expect(409);

        expect(response.body.code).toBe('EMAIL_EXISTS');
      });
    });
  });

  describe('Event Management Endpoints', () => {
    beforeEach(async () => {
      // Register organizer and attendee
      const organizerResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'organizer@example.com',
          password: 'password123',
          firstName: 'Jane',
          lastName: 'Organizer',
          role: 'organizer'
        });

      const userResponse = await request(app)
        .post('/api/users/register')
        .send({
          email: 'attendee@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Attendee',
          role: 'attendee'
        });

      organizerToken = organizerResponse.body.token;
      organizerId = organizerResponse.body.user.id;
      userToken = userResponse.body.token;
      userId = userResponse.body.user.id;
    });

    describe('POST /api/events', () => {
      it('should create event as organizer', async () => {
        const eventData = {
          title: 'Test Event',
          description: 'A test event description',
          date: '2025-12-25',
          time: '14:00',
          duration: 120,
          location: 'Virtual Meeting Room',
          maxParticipants: 50,
          category: 'Technology'
        };

        const response = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send(eventData)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Event created successfully');
        expect(response.body.event.title).toBe(eventData.title);
        expect(response.body.event.organizerId).toBe(organizerId);

        eventId = response.body.event.id;
      });

      it('should fail to create event as attendee', async () => {
        const eventData = {
          title: 'Test Event',
          description: 'A test event description',
          date: '2025-12-25',
          time: '14:00',
          location: 'Virtual Meeting Room'
        };

        const response = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${userToken}`)
          .send(eventData)
          .expect(403);

        expect(response.body.code).toBe('INSUFFICIENT_PRIVILEGES');
      });

      it('should fail with invalid date', async () => {
        const eventData = {
          title: 'Test Event',
          description: 'A test event description',
          date: '2020-01-01', // Past date
          time: '14:00',
          location: 'Virtual Meeting Room'
        };

        const response = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send(eventData)
          .expect(400);

        expect(response.body.details).toContain('Event date cannot be in the past');
      });
    });

    describe('GET /api/events', () => {
      beforeEach(async () => {
        // Create a test event
        const eventResponse = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            title: 'Test Event',
            description: 'A test event description',
            date: '2025-12-25',
            time: '14:00',
            location: 'Virtual Meeting Room'
          });

        eventId = eventResponse.body.event.id;
      });

      it('should get all public events without authentication', async () => {
        const response = await request(app)
          .get('/api/events')
          .expect(200);

        expect(response.body).toHaveProperty('events');
        expect(response.body).toHaveProperty('pagination');
        expect(response.body.events).toHaveLength(1);
      });

      it('should get events with filters', async () => {
        const response = await request(app)
          .get('/api/events?category=Technology&status=upcoming')
          .expect(200);

        expect(response.body).toHaveProperty('events');
        expect(response.body).toHaveProperty('filters');
      });

      it('should search events', async () => {
        const response = await request(app)
          .get('/api/events?search=Test')
          .expect(200);

        expect(response.body.events.length).toBeGreaterThan(0);
        expect(response.body.events[0].title).toContain('Test');
      });
    });

    describe('POST /api/events/:id/register', () => {
      beforeEach(async () => {
        // Create a test event
        const eventResponse = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            title: 'Test Event',
            description: 'A test event description',
            date: '2025-12-25',
            time: '14:00',
            location: 'Virtual Meeting Room',
            maxParticipants: 2
          });

        eventId = eventResponse.body.event.id;
      });

      it('should register user for event', async () => {
        const response = await request(app)
          .post(`/api/events/${eventId}/register`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(201);

        expect(response.body).toHaveProperty('message', 'Successfully registered for event');
        expect(response.body.registrationCount).toBe(1);
      });

      it('should fail to register twice for same event', async () => {
        // Register first time
        await request(app)
          .post(`/api/events/${eventId}/register`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(201);

        // Try to register again
        const response = await request(app)
          .post(`/api/events/${eventId}/register`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(409);

        expect(response.body.code).toBe('ALREADY_REGISTERED');
      });

      it('should fail to register for non-existent event', async () => {
        const response = await request(app)
          .post('/api/events/non-existent-id/register')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(404);

        expect(response.body.code).toBe('EVENT_NOT_FOUND');
      });

      it('should fail when event is full', async () => {
        // Register maximum participants
        await request(app)
          .post(`/api/events/${eventId}/register`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(201);

        // Register another user
        const user2Response = await request(app)
          .post('/api/users/register')
          .send({
            email: 'user2@example.com',
            password: 'password123',
            firstName: 'User',
            lastName: 'Two'
          });

        await request(app)
          .post(`/api/events/${eventId}/register`)
          .set('Authorization', `Bearer ${user2Response.body.token}`)
          .expect(201);

        // Try to register third user (should fail)
        const user3Response = await request(app)
          .post('/api/users/register')
          .send({
            email: 'user3@example.com',
            password: 'password123',
            firstName: 'User',
            lastName: 'Three'
          });

        const response = await request(app)
          .post(`/api/events/${eventId}/register`)
          .set('Authorization', `Bearer ${user3Response.body.token}`)
          .expect(400);

        expect(response.body.code).toBe('EVENT_FULL');
      });
    });

    describe('PUT /api/events/:id', () => {
      beforeEach(async () => {
        // Create a test event
        const eventResponse = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            title: 'Test Event',
            description: 'A test event description',
            date: '2025-12-25',
            time: '14:00',
            location: 'Virtual Meeting Room'
          });

        eventId = eventResponse.body.event.id;
      });

      it('should update event as organizer', async () => {
        const updates = {
          title: 'Updated Event Title',
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/api/events/${eventId}`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send(updates)
          .expect(200);

        expect(response.body.event.title).toBe(updates.title);
        expect(response.body.event.description).toBe(updates.description);
      });

      it('should fail to update event as non-owner', async () => {
        const response = await request(app)
          .put(`/api/events/${eventId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .send({ title: 'Hacked Title' })
          .expect(403);

        expect(response.body.code).toBe('INSUFFICIENT_PRIVILEGES');
      });
    });

    describe('DELETE /api/events/:id', () => {
      beforeEach(async () => {
        // Create a test event
        const eventResponse = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            title: 'Test Event',
            description: 'A test event description',
            date: '2025-12-25',
            time: '14:00',
            location: 'Virtual Meeting Room'
          });

        eventId = eventResponse.body.event.id;
      });

      it('should delete event as organizer', async () => {
        const response = await request(app)
          .delete(`/api/events/${eventId}`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .expect(200);

        expect(response.body).toHaveProperty('message', 'Event deleted successfully');

        // Verify event is deleted
        await request(app)
          .get(`/api/events/${eventId}`)
          .expect(404);
      });

      it('should fail to delete event as non-owner', async () => {
        const response = await request(app)
          .delete(`/api/events/${eventId}`)
          .set('Authorization', `Bearer ${userToken}`)
          .expect(403);

        expect(response.body.code).toBe('INSUFFICIENT_PRIVILEGES');
      });
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('API Documentation', () => {
    it('should return API documentation', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('endpoints');
      expect(response.body.name).toBe('Virtual Event Management Platform API');
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/non-existent-endpoint')
        .expect(404);

      expect(response.body.code).toBe('NOT_FOUND');
    });
  });
});
