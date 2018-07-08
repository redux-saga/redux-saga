const { NODE_ENV, BABEL_ENV } = process.env

const cjs = BABEL_ENV === 'cjs' || NODE_ENV === 'test'

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: false,
        forceAllTransforms: true,
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [cjs && '@babel/plugin-transform-modules-commonjs', '@babel/plugin-proposal-object-rest-spread'].filter(
    Boolean,
  ),
}
