// Jest test setup file
// This file handles global test setup and teardown

// Suppress console logs during tests unless it's an error
if (process.env.NODE_ENV !== 'test') {
  process.env.NODE_ENV = 'test';
}

// Handle unhandled promise rejections during tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in test:', reason);
});

// Increase test timeout for slower operations
jest.setTimeout(15000);

// Global teardown to ensure all handles are closed
afterAll(async () => {
  // Small delay to ensure all async operations complete
  await new Promise(resolve => setTimeout(resolve, 100));
});
