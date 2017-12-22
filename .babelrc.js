module.exports = {
  presets: [
    [
      '@babel/env',
      {
        loose: true,
        modules: process.env.BABEL_ENV === 'cjs' ? 'commonjs' : false,
        exclude: ['transform-typeof-symbol'],
        forceAllTransforms: process.env.NODE_ENV === 'production',
      },
    ],
    '@babel/react',
    '@babel/stage-2',
  ],
  plugins: ['annotate-pure-calls'],
}
