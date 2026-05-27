const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Only treat files with .test.* as test files (avoid src/app/test.ts being picked up)
  testRegex: '\\.(test)\\.(ts|tsx|js)$',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest', // Cambia a ts-jest
  },
};

module.exports = createJestConfig(customJestConfig);
