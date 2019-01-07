import * as path from 'path'
import alias from 'rollup-plugin-alias'
import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import { terser } from 'rollup-plugin-terser'
import { rollup as lernaAlias } from 'lerna-alias'
import pkg from './package.json'

const ensureArray = maybeArr => (Array.isArray(maybeArr) ? maybeArr : [maybeArr])

const makeExternalPredicate = externalArr => {
  if (!externalArr.length) {
    return () => false
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
  return id => pattern.test(id)
}

const deps = Object.keys(pkg.dependencies || {})
const peerDeps = Object.keys(pkg.peerDependencies || {})

let aliases = lernaAlias()
aliases = {
  '@redux-saga/core/effects': aliases['@redux-saga/core'].replace(/index\.js$/, 'effects.js'),
  '@babel/runtime/helpers/extends': require.resolve('@babel/runtime/helpers/esm/extends'),
  ...aliases,
}

const createConfig = ({ input, output, external, env, min = false }) => ({
  input,
  output: ensureArray(output).map(format => ({
    name: 'ReduxSaga',
    exports: 'named',
    ...format,
  })),
  external: makeExternalPredicate(external === 'peers' ? peerDeps : deps.concat(peerDeps)),
  plugins: [
    alias(aliases),
    nodeResolve({
      jsnext: true,
    }),
    babel({
      exclude: 'node_modules/**',
      // Es modules in browser does not need transpilation
      babelrc: !(output.format === 'esm' && min),
      babelrcRoots: path.resolve(__dirname, '../*'),
    }),
    env &&
      replace({
        'process.env.NODE_ENV': JSON.stringify(env),
      }),
    min &&
      terser({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      }),
  ].filter(Boolean),
  onwarn(warning, warn) {
    if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
      return
    }
    warn(warning)
  },
})

const multiInput = {
  core: 'src/index.js',
  effects: 'src/effects.js',
}

export default [
  createConfig({
    input: multiInput,
    output: [
      {
        dir: 'dist',
        format: 'esm',
      },
      {
        dir: 'dist',
        format: 'cjs',
      },
    ].map(format => ({ entryFileNames: 'redux-saga-[name]-npm-proxy.[format].js', ...format })),
  }),
  createConfig({
    input: 'src/index.umd.js',
    output: {
      file: pkg.unpkg.replace(/\.min\.js$/, '.js'),
      format: 'umd',
    },
    external: 'peers',
    env: 'development',
  }),
  createConfig({
    input: 'src/index.umd.js',
    output: {
      file: pkg.unpkg,
      format: 'umd',
    },
    external: 'peers',
    env: 'production',
    min: true,
  }),
  createConfig({
    input: multiInput,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: 'redux-saga-[name].esmodules-browsers.js',
    },
    min: true,
    external: 'peers',
    env: 'production',
  }),
]
