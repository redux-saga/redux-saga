var path = require('path')
var webpack = require('webpack')

module.exports = {
  devtool: 'cheap-module-eval-source-map',
  entry: [
    'webpack-hot-middleware/client?reload=true',
    path.join(__dirname, 'index'),
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ],
  module: {
    rules: [{
      test: /\.js$/,
      use: 'babel-loader',
      exclude: /node_modules/,
      include: [__dirname],
    }],
  },
}

console.log('resolveLoader', path.resolve(path.join(__dirname, 'node_modules')))

// When inside Redux-Saga repo, prefer src to compiled version.
// You can safely delete these lines in your project.
var reduxSagaSrc = path.join(__dirname, '..', '..', 'src')
var reduxSagaNodeModules = path.join(__dirname, '..', '..', 'node_modules')
var fs = require('fs')
if (fs.existsSync(reduxSagaSrc) && fs.existsSync(reduxSagaNodeModules)) {
  // Resolve Redux-Saga to source
  module.exports.resolve = { alias: { 'redux-saga': reduxSagaSrc } }
  // Compile Redux-Saga from source
  module.exports.module.rules[0].include.push(reduxSagaSrc)
  module.exports.module.rules[0].include.push(path.join(__dirname, '..', 'sagaMonitor'))
}
