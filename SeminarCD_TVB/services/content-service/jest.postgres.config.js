const baseConfig = require('./jest.config');

module.exports = {
  ...baseConfig,
  testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
  collectCoverage: false,
};
