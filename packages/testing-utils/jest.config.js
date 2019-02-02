const lernaAliases = require('lerna-alias').jest()

module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: Object.assign(lernaAliases, {
    '^redux-saga/effects$': lernaAliases['^redux-saga$'].replace(/index\.js$/, 'effects.js'),
    '^@redux-saga/core/effects$': lernaAliases['^@redux-saga/core$'].replace(/index\.js$/, 'effects.js'),
  }),
  transform: {
    '.js$': __dirname + '/babel-transformer.jest.js',
  },
}
