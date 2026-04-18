module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],
  collectCoverageFrom: [
    'src/api/**/utils/**/*.js',
    '!src/admin/**',
  ],
  coverageDirectory: 'coverage',
  verbose: true,
};
