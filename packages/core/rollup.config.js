import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import replace from 'rollup-plugin-replace';
import uglify from 'rollup-plugin-uglify';
import { list as babelHelpersList } from '@babel/helpers';

var env = process.env.NODE_ENV
var config = {
  output: {
    format: 'umd',
    name: 'ReduxSaga',
    exports: 'named',
  },
  plugins: [
    nodeResolve({
      jsnext: true,
    }),
    babel({
      exclude: 'node_modules/**',
      externalHelpersWhitelist: babelHelpersList.filter(helperName => helperName !== 'AsyncGenerator'),
    }),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
  ],
}

if (env === 'production') {
  config.plugins.push(
    uglify({
      compress: {
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        warnings: false,
      },
    })
  )
}

export default config
