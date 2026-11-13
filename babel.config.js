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
  overrides: [
    {
      // Build-time plugin that only ever runs in Node, so it doesn't need ES5 output.
      test: './packages/unplugin',
      presets: [['@babel/preset-env', { loose: true, targets: { node: '22' } }]],
    },
  ],
}
