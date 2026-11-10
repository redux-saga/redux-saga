import path from 'node:path'
import { defineConfig } from 'vitest/config'
// Loaded from source: the config file is bundled by Vite, so this needs no build step.
import reduxSaga from './packages/unplugin/src/vite.js'

// Tests run in Vite's server (SSR) environment, so its resolve conditions apply.
// `development` makes workspace packages and `#is-development`-style package imports
// resolve to their dev variants, so dev-only warnings and checks are exercised.
// `module` picks the ESM entrypoints, which `preconstruct dev` links straight to the sources.
const ssr = {
  resolve: {
    conditions: ['development', 'module', 'node'],
  },
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
        // The error-demo example asserts on saga stacks, which rely on the source locations
        // injected by @redux-saga/unplugin, as in its own vite.config.js.
        plugins: [
          reduxSaga({
            include: '/examples/error-demo/src/',
            cwd: path.resolve(import.meta.dirname, 'examples/error-demo'),
          }),
        ],
        test: {
          name: 'examples',
          environment: 'node',
          include: ['examples/*/test/**/*.js'],
        },
      },
    ],
  },
})
