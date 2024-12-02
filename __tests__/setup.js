// __tests__/setup.js

process.env.ACCESS_TOKEN_SECRET = 'test-secret-key';
process.env.NODE_ENV = 'test';

beforeEach(() => {
  jest.clearAllMocks();
});