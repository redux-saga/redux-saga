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

export default {
  input: 'src/index.js',
  output: [
    {
      file: pkg.module,
      format: 'esm',
    },
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
    },
  ],
  external: makeExternalPredicate(deps.concat(peerDeps)),
  plugins: [
    babel({
      exclude: 'node_modules/**',
    }),
  ],
}
