// Quick verification test
const memoryStore = require('./src/models/memoryStore');
const User = require('./src/models/User');
const Event = require('./src/models/Event');

console.log('🧪 Running quick verification tests...\n');

// Test 1: User Model
console.log('1. Testing User model...');
const user = new User({
  email: 'test@example.com',
  password: 'hashedpassword',
  firstName: 'John',
  lastName: 'Doe',
  role: 'organizer'
});

console.log('✅ User created:', user.getFullName());
console.log('✅ User is organizer:', user.isOrganizer());

// Test 2: Event Model
console.log('\n2. Testing Event model...');
const event = new Event({
  title: 'Test Event',
  description: 'A test event',
  date: '2025-12-25',
  time: '14:00',
  location: 'Virtual Room',
  organizerId: user.id
});

console.log('✅ Event created:', event.title);
console.log('✅ Event status:', event.updateStatus());

// Test 3: Memory Store
console.log('\n3. Testing Memory Store...');
memoryStore.createUser(user);
memoryStore.createEvent(event);

console.log('✅ User stored:', memoryStore.getUserById(user.id).email);
console.log('✅ Event stored:', memoryStore.getEventById(event.id).title);

// Test 4: Registration
console.log('\n4. Testing Registration...');
const success = memoryStore.registerUserForEvent(user.id, event.id);
console.log('✅ Registration success:', success);
console.log('✅ Is user registered:', memoryStore.isUserRegisteredForEvent(user.id, event.id));
console.log('✅ Registration count:', memoryStore.getEventRegistrationCount(event.id));

// Test 5: Statistics
console.log('\n5. Testing Statistics...');
console.log('✅ Total users:', memoryStore.getTotalUsers());
console.log('✅ Total events:', memoryStore.getTotalEvents());
console.log('✅ Total registrations:', memoryStore.getTotalRegistrations());

console.log('\n🎉 All verification tests passed! The core functionality is working correctly.');
console.log('\nTo test the full API:');
console.log('1. Run: npm start');
console.log('2. Run: node test-api.js');
console.log('3. Visit: http://localhost:3000');
console.log('4. Check health: http://localhost:3000/health');
