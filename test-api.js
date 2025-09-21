const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  try {
    console.log('🧪 Testing Virtual Event Management API...\n');
    
    // Generate unique timestamp for email addresses
    const timestamp = Date.now();
    
    // Test 1: Health Check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', healthResponse.data.status);
    
    // Test 2: Register Organizer
    console.log('\n2. Registering organizer...');
    const organizerData = {
      email: `organizer-${timestamp}@test.com`,
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Organizer',
      role: 'organizer'
    };
    
    const organizerResponse = await axios.post(`${BASE_URL}/api/users/register`, organizerData);
    const organizerToken = organizerResponse.data.token;
    console.log('✅ Organizer registered:', organizerResponse.data.user.email);
    
    // Test 3: Register Attendee
    console.log('\n3. Registering attendee...');
    const attendeeData = {
      email: `attendee-${timestamp}@test.com`,
      password: 'password123',
      firstName: 'John',
      lastName: 'Attendee',
      role: 'attendee'
    };
    
    const attendeeResponse = await axios.post(`${BASE_URL}/api/users/register`, attendeeData);
    const attendeeToken = attendeeResponse.data.token;
    console.log('✅ Attendee registered:', attendeeResponse.data.user.email);
    
    // Test 4: Create Event
    console.log('\n4. Creating event...');
    const eventData = {
      title: 'Test Conference 2025',
      description: 'A comprehensive test conference for our API',
      date: '2025-12-25',
      time: '14:00',
      duration: 120,
      location: 'Virtual Conference Room',
      maxParticipants: 50,
      category: 'Technology'
    };
    
    const eventResponse = await axios.post(`${BASE_URL}/api/events`, eventData, {
      headers: { Authorization: `Bearer ${organizerToken}` }
    });
    const eventId = eventResponse.data.event.id;
    console.log('✅ Event created:', eventResponse.data.event.title);
    
    // Test 5: Get All Events
    console.log('\n5. Getting all events...');
    const eventsResponse = await axios.get(`${BASE_URL}/api/events`);
    console.log('✅ Events retrieved:', eventsResponse.data.events.length, 'events found');
    
    // Test 6: Register for Event
    console.log('\n6. Registering attendee for event...');
    const registrationResponse = await axios.post(`${BASE_URL}/api/events/${eventId}/register`, {}, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    console.log('✅ Registration successful:', registrationResponse.data.message);
    
    // Test 7: Get User Profile
    console.log('\n7. Getting attendee profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${attendeeToken}` }
    });
    console.log('✅ Profile retrieved:', profileResponse.data.user.email);
    console.log('   Registrations:', profileResponse.data.registrations.length);
    
    // Test 8: Get Event Details
    console.log('\n8. Getting event details...');
    const eventDetailsResponse = await axios.get(`${BASE_URL}/api/events/${eventId}`);
    console.log('✅ Event details retrieved:', eventDetailsResponse.data.event.title);
    console.log('   Registration count:', eventDetailsResponse.data.event.registrationCount);
    
    // Test 9: Login Test
    console.log('\n9. Testing login...');
    const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
      email: 'attendee@test.com',
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.data.user.email);
    
    console.log('\n🎉 All tests passed! The API is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testAPI();
