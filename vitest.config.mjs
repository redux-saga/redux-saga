import path from 'node:path'
import { transformSync } from '@babel/core'
import { defineConfig } from 'vitest/config'

// Tests run in Vite's server (SSR) environment, so its resolve conditions apply.
// `development` makes workspace packages and `#is-development`-style package imports
// resolve to their dev variants, so dev-only warnings and checks are exercised.
// `module` picks the ESM entrypoints, which `preconstruct dev` links straight to the sources.
const ssr = {
  resolve: {
    conditions: ['development', 'module', 'node'],
  },
}

// The error-demo example asserts on saga stacks, which rely on the source locations
// injected by babel-plugin-redux-saga, so its sources go through its own Babel config.
function babelExampleSources(exampleDir) {
  const root = path.resolve(import.meta.dirname, exampleDir)
  const srcDir = path.join(root, 'src') + path.sep
  return {
    name: 'babel-example-sources',
    enforce: 'pre',
    transform(code, id) {
      if (!id.startsWith(srcDir)) return null
      const result = transformSync(code, {
        cwd: root,
        filename: id,
        sourceMaps: true,
        caller: { name: 'vitest', supportsStaticESM: true },
      })
      return { code: result.code, map: result.map }
    },
  }
}

export default defineConfig({
  test: {
    projects: [
      {
        ssr,
        test: {
          name: 'packages',
          environment: 'node',
          include: ['packages/*/__tests__/**/*.js', 'packages/*/test/*.test.js'],
        },
      },
      {
        ssr,
        plugins: [babelExampleSources('examples/error-demo')],
        test: {
          name: 'examples',
          environment: 'node',
          include: ['examples/*/test/**/*.js'],
        },
      },
    ],
  },
})
