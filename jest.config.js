/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['development'],
  },
  testPathIgnorePatterns: ['.+/packages/.+/types/'],
}
