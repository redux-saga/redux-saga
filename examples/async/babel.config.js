const { NODE_ENV, BABEL_ENV } = process.env

const cjs = BABEL_ENV === 'cjs' || NODE_ENV === 'test'

module.exports = {
  presets: [
    [
      '@babel/env',
      {
        loose: true,
        modules: false,
        forceAllTransforms: true,
      },
    ],
    '@babel/react',
    ['@babel/stage-2', { decoratorsLegacy: true }],
  ],
  plugins: [cjs && '@babel/transform-modules-commonjs'].filter(Boolean),
}
