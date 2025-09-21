// Simple API functionality test
const request = require('supertest');

// Mock the UUID to avoid import issues
jest.mock('uuid', () => ({
  v4: () => 'test-uuid-123'
}));

const app = require('../src/app');
const memoryStore = require('../src/models/memoryStore');

describe('Event Management API', () => {
  beforeEach(() => {
    memoryStore.clear();
  });

  test('Health endpoint should work', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body.status).toBe('healthy');
  });

  test('Should register a new user', async () => {
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

    expect(response.body.message).toBe('User registered successfully');
    expect(response.body.user.email).toBe(userData.email);
    expect(response.body.user).not.toHaveProperty('password');
    expect(response.body).toHaveProperty('token');
  });

  test('Should login with valid credentials', async () => {
    // First register a user
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe'
    };

    await request(app)
      .post('/api/users/register')
      .send(userData);

    // Then login
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: userData.email,
        password: userData.password
      })
      .expect(200);

    expect(response.body.message).toBe('Login successful');
    expect(response.body).toHaveProperty('token');
  });

  test('Should create and retrieve events', async () => {
    // Register an organizer
    const organizerData = {
      email: 'organizer@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Organizer',
      role: 'organizer'
    };

    const registerResponse = await request(app)
      .post('/api/users/register')
      .send(organizerData);

    const token = registerResponse.body.token;

    // Create an event
    const eventData = {
      title: 'Test Event',
      description: 'A test event',
      date: '2025-12-25',
      time: '14:00',
      location: 'Virtual Room',
      maxParticipants: 50
    };

    const createResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${token}`)
      .send(eventData)
      .expect(201);

    expect(createResponse.body.message).toBe('Event created successfully');
    expect(createResponse.body.event.title).toBe(eventData.title);

    // Get all events
    const eventsResponse = await request(app)
      .get('/api/events')
      .expect(200);

    expect(eventsResponse.body.events).toHaveLength(1);
    expect(eventsResponse.body.events[0].title).toBe(eventData.title);
  });

  test('Should register user for event', async () => {
    // Register organizer and create event
    const organizerResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'organizer@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Organizer',
        role: 'organizer'
      });

    const eventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerResponse.body.token}`)
      .send({
        title: 'Test Event',
        description: 'A test event',
        date: '2025-12-25',
        time: '14:00',
        location: 'Virtual Room'
      });

    const eventId = eventResponse.body.event.id;

    // Register attendee
    const attendeeResponse = await request(app)
      .post('/api/users/register')
      .send({
        email: 'attendee@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Attendee',
        role: 'attendee'
      });

    // Register for event
    const registrationResponse = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${attendeeResponse.body.token}`)
      .expect(201);

    expect(registrationResponse.body.message).toBe('Successfully registered for event');
  });

  test('Should handle authentication errors', async () => {
    // Try to access protected endpoint without token
    await request(app)
      .get('/api/users/profile')
      .expect(401);

    // Try to access with invalid token
    await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer invalid-token')
      .expect(401);
  });

  test('Should handle validation errors', async () => {
    // Try to register with invalid email
    const response = await request(app)
      .post('/api/users/register')
      .send({
        email: 'invalid-email',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe'
      })
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });

  test('API documentation endpoint should work', async () => {
    const response = await request(app)
      .get('/')
      .expect(200);

    expect(response.body.name).toBe('Virtual Event Management Platform API');
    expect(response.body).toHaveProperty('endpoints');
  });
});
