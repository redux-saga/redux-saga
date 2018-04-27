const { NODE_ENV, BABEL_ENV } = process.env

const cjs = BABEL_ENV === 'cjs' || NODE_ENV === 'test'
const prod = NODE_ENV === 'production'

module.exports = {
  presets: [
    [
      '@babel/env',
      {
        targets: {
          browsers: [
            'last 2 Chrome versions',
            'last 2 Firefox versions',
            'last 2 Safari versions',
          ]
        },
        debug: !prod,
        loose: true,
        modules: false,
        forceAllTransforms: prod
      },
    ],
    '@babel/react',
    '@babel/stage-2',
  ],
  plugins: [
    cjs && '@babel/transform-modules-commonjs',
  ].filter(Boolean),
}
