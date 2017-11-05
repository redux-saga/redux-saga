module.exports = {
  presets: [
    [
      'env',
      {
        loose: true,
        modules: process.env.BABEL_ENV === 'es' ? false : 'commonjs',
        forceAllTransforms: process.env.NODE_ENV === 'production',
      },
    ],
    'react',
    'stage-2',
  ],
}
