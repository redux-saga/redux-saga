import * as path from 'path'
import alias from 'rollup-plugin-alias'
import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import uglify from 'rollup-plugin-uglify'
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

const helperPath = /^(@babel\/runtime\/helpers)\/(\w+)$/

const rewriteRuntimeHelpersImports = ({ types: t }) => ({
  name: 'rewrite-runtime-helpers-imports',
  visitor: {
    ImportDeclaration(path) {
      const source = path.get('source')
      if (!helperPath.test(source.node.value)) {
        return
      }
      const rewrittenPath = source.node.value.replace(helperPath, (m, p1, p2) => [p1, 'esm', p2].join('/'))
      source.replaceWith(t.stringLiteral(rewrittenPath))
    },
  },
})

const createConfig = ({ input, output, external, env, min = false, useESModules = output.format !== 'cjs' }) => ({
  input,
  experimentalCodeSplitting: typeof input !== 'string',
  output: {
    ...output,
    name: 'ReduxSaga',
    exports: 'named',
  },
  external: makeExternalPredicate(external === 'peers' ? peerDeps : deps.concat(peerDeps)),
  plugins: [
    alias(lernaAlias()),
    nodeResolve({
      jsnext: true,
    }),
    babel({
      exclude: 'node_modules/**',
      babelrcRoots: path.resolve(__dirname, '../*'),
      plugins: [
        useESModules && rewriteRuntimeHelpersImports,
        [
          '@babel/plugin-transform-runtime',
          {
            useESModules,
          },
        ],
      ].filter(Boolean),
      runtimeHelpers: true,
    }),
    env &&
      replace({
        'process.env.NODE_ENV': JSON.stringify(env),
      }),
    min &&
      uglify({
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
      }),
  ].filter(Boolean),
})

const multiInput = {
  core: 'src/index.js',
  effects: 'src/effects.js',
}

export default [
  createConfig({
    input: multiInput,
    output: {
      dir: 'dist',
      format: 'esm',
      entryFileNames: 'redux-saga-[name].[format].js',
    },
  }),
  createConfig({
    input: multiInput,
    output: {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: 'redux-saga-[name].prod.[format].js',
    },
    env: 'production',
  }),
  createConfig({
    input: multiInput,
    output: {
      dir: 'dist',
      format: 'cjs',
      entryFileNames: 'redux-saga-[name].dev.[format].js',
    },
    env: 'development',
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
