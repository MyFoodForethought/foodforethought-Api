// jest.config.js

module.exports = {
    testEnvironment: 'node',
    roots: ['<rootDir>'],
    testMatch: ['**/__tests__/**/*.test.js'],
    moduleDirectories: ['node_modules', '<rootDir>'],
    testPathIgnorePatterns: ['/node_modules/'],
    verbose: true,
    // Removing setupFilesAfterEnv for now
    // setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  };