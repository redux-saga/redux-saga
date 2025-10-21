module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        exclude: ['transform-regenerator'],
      },
    ],
  ],
  plugins: ['babel-plugin-annotate-pure-calls'],
}
