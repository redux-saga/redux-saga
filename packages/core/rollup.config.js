import alias from 'rollup-plugin-alias'
import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import uglify from 'rollup-plugin-uglify'
import { rollup as lernaAlias } from 'lerna-alias'
import pkg from './package.json'

const ensureArray = maybeArr => Array.isArray(maybeArr) ? maybeArr : [maybeArr]

const makeExternalPredicate = externalArr => {
  if (!externalArr.length) {
    return () => false
  }
  const pattern = new RegExp(`^(${externalArr.join("|")})($|/)`)
  return id => pattern.test(id)
}

const deps = Object.keys(pkg.dependencies || {})
const peerDeps = Object.keys(pkg.peerDependencies || {})

const createConfig = ({
  input,
  output,
  external,
  env,
  min = false,
}) => ({
  input,
  experimentalCodeSplitting: typeof input !== 'string',
  output: ensureArray(output).map(format =>
    Object.assign(
      {},
      format,
      {
        name: 'ReduxSaga',
        exports: 'named',
      }
    )
  ),
  external: makeExternalPredicate(
    external === 'peers'
      ? peerDeps
      : deps.concat(peerDeps)
  ),
  plugins: [
    alias(lernaAlias()),
    nodeResolve({
      jsnext: true,
    }),
    babel({
      exclude: 'node_modules/**',
    }),
    env && replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    min && uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false,
      },
    }),
  ].filter(Boolean),
})

export default [
  createConfig({
    input: {
      core: 'src/index.js',
      effects: 'src/effects.js',
      utils: 'src/utils.js',
    },
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: 'redux-saga-[name].esm.js',
    },
  }),
  createConfig({
    input: {
      core: 'src/index.js',
      effects: 'src/effects.js',
      utils: 'src/utils.js',
    },
    output: {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: 'redux-saga-[name].cjs.js',
    },
  }),
  createConfig({
    input: 'src/index.umd.js',
    output: {
      file: 'dist/redux-saga.umd.js',
      format: 'umd',
    },
    external: 'peers',
    env: 'development',
  }),
  createConfig({
    input: 'src/index.umd.js',
    output: {
      file: 'dist/redux-saga.min.umd.js',
      format: 'umd',
    },
    external: 'peers',
    env: 'production',
    min: true,
  }),
]
