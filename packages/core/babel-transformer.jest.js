const path = require('path')
const { createTransformer } = require('babel-jest')

module.exports = createTransformer({
  babelrcRoots: path.resolve(__dirname, '../*'),
})
