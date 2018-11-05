const lernaAliases = require('lerna-alias').jest()

module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: Object.assign(lernaAliases, { 'redux-saga/effects': `${lernaAliases['redux-saga']}/effects` }),
  transform: {
    '.js$': __dirname + '/babel-transformer.jest.js',
  },
}
