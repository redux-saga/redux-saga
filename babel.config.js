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
      test: './packages/use-saga/__tests__',
      presets: [['@babel/preset-react', { runtime: 'automatic' }]],
    },
  ],
}
