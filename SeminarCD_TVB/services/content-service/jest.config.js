module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/tests/integration/'],
  collectCoverageFrom: [
    'src/api/**/controllers/**/*.js',
    '!src/admin/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 120000,
  maxWorkers: 1,
};
