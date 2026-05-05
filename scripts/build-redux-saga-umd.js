const fs = require('fs/promises')
const path = require('path')
const { rollup } = require('rollup')
const alias = require('rollup-plugin-alias')
const babel = require('rollup-plugin-babel')
const nodeResolve = require('rollup-plugin-node-resolve')
const replace = require('rollup-plugin-replace')
const { minify } = require('terser')

const root = path.resolve(__dirname, '..')

const aliases = {
  '@redux-saga/core/effects': path.join(root, 'packages/core/src/effects.js'),
  '@redux-saga/core': path.join(root, 'packages/core/src/index.js'),
  '@redux-saga/deferred': path.join(root, 'packages/deferred/src/index.js'),
  '@redux-saga/delay-p': path.join(root, 'packages/delay-p/src/index.js'),
  '@redux-saga/is': path.join(root, 'packages/is/src/index.js'),
  '@redux-saga/symbols': path.join(root, 'packages/symbols/src/index.js'),
  '@babel/runtime/helpers/extends': require.resolve('@babel/runtime/helpers/esm/extends'),
  '#is-development': path.join(root, 'packages/core/src/resolved-conditions/production.js'),
}

function createConfig(input) {
  return {
    input: path.join(root, input),
    plugins: [
      alias(aliases),
      nodeResolve({ jsnext: true, browser: true }),
      babel({
        exclude: 'node_modules/**',
        babelrcRoots: path.join(root, 'packages/*'),
        babelHelpers: 'runtime',
        plugins: [
          [
            '@babel/plugin-transform-runtime',
            {
              useESModules: true,
            },
          ],
        ],
      }),
      replace({
        'typeof document': JSON.stringify('object'),
        'typeof window': JSON.stringify('object'),
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),
    ],
    treeshake: {
      propertyReadSideEffects: false,
    },
    onwarn(warning, warn) {
      if (warning.code === 'CIRCULAR_DEPENDENCY' || warning.code === 'THIS_IS_UNDEFINED') {
        return
      }
      warn(warning)
    },
  }
}

async function writeFile(file, contents) {
  const absolutePath = path.join(root, file)
  await fs.mkdir(path.dirname(absolutePath), { recursive: true })
  await fs.writeFile(absolutePath, contents)
}

async function buildOne({ input, file, minFile, name }) {
  const bundle = await rollup(createConfig(input))
  const { output } = await bundle.generate({
    file: path.join(root, file),
    format: 'umd',
    name,
    exports: 'named',
    sourcemap: true,
  })

  const chunk = output.find((item) => item.type === 'chunk')
  await writeFile(file, `${chunk.code}\n//# sourceMappingURL=${path.basename(file)}.map\n`)
  await writeFile(`${file}.map`, chunk.map.toString())

  const minified = await minify(chunk.code, {
    compress: {
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
    },
    mangle: true,
    sourceMap: {
      content: chunk.map,
      filename: path.basename(minFile),
      url: `${path.basename(minFile)}.map`,
    },
  })

  await writeFile(minFile, minified.code)
  await writeFile(`${minFile}.map`, minified.map)
}

Promise.all([
  buildOne({
    input: 'packages/redux-saga/src/index.umd.js',
    file: 'packages/redux-saga/dist/redux-saga.umd.js',
    minFile: 'packages/redux-saga/dist/redux-saga.umd.min.js',
    name: 'ReduxSaga',
  }),
  buildOne({
    input: 'packages/redux-saga/src/effects.js',
    file: 'packages/redux-saga/effects/dist/redux-saga-effects.umd.js',
    minFile: 'packages/redux-saga/effects/dist/redux-saga-effects.umd.min.js',
    name: 'ReduxSagaEffects',
  }),
]).catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error)
  process.exitCode = 1
})
