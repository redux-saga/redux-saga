const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'off',
    },
  },
  {
    ignores: ['**/test/fixtures/**'],
  },
  {
    files: ['packages/*/src/**/*.js', 'packages/*/test/**/*.js'],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'comma-dangle': ['error', 'always-multiline'],
      'no-extra-semi': 'off',
      'no-prototype-builtins': 'off',
      'no-useless-assignment': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.js', '**/test/**/*.js'],
    rules: {
      'require-yield': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.js', '**/babel-plugin-redux-saga/test/*.js'],
    languageOptions: {
      globals: globals.jest,
    },
  },
]
