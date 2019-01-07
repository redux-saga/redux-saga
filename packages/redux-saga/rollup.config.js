import * as path from 'path'
import alias from 'rollup-plugin-alias'
import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import { terser } from 'rollup-plugin-terser'
import { rollup as lernaAlias } from 'lerna-alias'
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

let aliases = lernaAlias()
aliases = {
  '@redux-saga/core/effects': aliases['@redux-saga/core'].replace(/index\.js$/, 'effects.js'),
  '@babel/runtime/helpers/extends': require.resolve('@babel/runtime/helpers/esm/extends'),
  ...aliases,
}

const presetEnvPath = require.resolve('@babel/preset-env')

const createConfig = ({
  input,
  output,
  external,
  env,
  min = false,
  useESModules = output.format !== 'cjs',
  esmodulesBrowsersTarget = false,
}) => ({
  input,
  output: {
    name: 'ReduxSaga',
    exports: 'named',
    ...output,
  },
  external: makeExternalPredicate(external === 'peers' ? peerDeps : deps.concat(peerDeps)),
  plugins: [
    alias(aliases),
    nodeResolve({
      jsnext: true,
    }),
    babel.custom(() => {
      if (!esmodulesBrowsersTarget) {
        return {}
      }
      return {
        config(config) {
          return {
            ...config.options,
            presets: config.options.presets.map(preset => {
              if (preset.file.resolved !== presetEnvPath) {
                return preset
              }

              return [
                presetEnvPath,
                {
                  ...preset.options,
                  targets: { esmodules: true },
                },
              ]
            }),
          }
        },
      }
    })({
      exclude: 'node_modules/**',
      babelrcRoots: path.resolve(__dirname, '../*'),
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
  ...['esm', 'cjs'].map(format =>
    createConfig({
      input: multiInput,
      output: {
        dir: 'dist',
        format,
        entryFileNames: 'redux-saga-[name]-npm-proxy.[format].js',
      },
    }),
  ),
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
    esmodulesBrowsersTarget: true,
    min: true,
    external: 'peers',
    env: 'production',
  }),
]
