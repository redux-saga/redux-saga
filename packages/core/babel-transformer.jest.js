const path = require('path')
const { createTransformer } = require('babel-7-jest')

module.exports = createTransformer({
  babelrcRoots: path.resolve(__dirname, '../*'),
})
