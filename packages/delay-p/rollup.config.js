import babel from 'rollup-plugin-babel'
import pkg from './package.json'

const makeExternalPredicate = externalArr => {
  if (!externalArr.length) {
    return () => false
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
  return id => pattern.test(id)
}

const deps = Object.keys(pkg.dependencies || {})
const peerDeps = Object.keys(pkg.peerDependencies || {})

const createConfig = ({ output, useESModules = output.format !== 'cjs' }) => ({
  input: 'src/index.js',
  output: {
    exports: 'named',
    ...output,
  },
  external: makeExternalPredicate(deps.concat(peerDeps)),
  plugins: [
    babel({
      exclude: 'node_modules/**',
      babelHelpers: 'runtime',
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            useESModules,
          },
        ],
      ],
    }),
  ],
})

export default [
  createConfig({
    output: {
      file: pkg.module,
      format: 'esm',
    },
  }),
  createConfig({
    output: {
      file: pkg.main,
      format: 'cjs',
    },
  }),
]
