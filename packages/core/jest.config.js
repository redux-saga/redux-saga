const lernaAliases = require('lerna-alias').jest()

module.exports = {
  testEnvironment: 'node',
  moduleNameMapper: lernaAliases,
  transform: {
    '.js$': __dirname + '/babel-transformer.jest.js',
  },
}
