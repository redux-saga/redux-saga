module.exports = {
  presets: [
    [
      '@babel/env',
      {
        loose: true,
        modules: process.env.BABEL_ENV === 'es' ? false : 'commonjs',
        forceAllTransforms: process.env.NODE_ENV === 'production',
      },
    ],
    '@babel/react',
    '@babel/stage-2',
  ],
}
