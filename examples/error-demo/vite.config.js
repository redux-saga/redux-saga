import path from 'node:path'
import { createRequire } from 'node:module'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// The plugin is loaded with `require` rather than passed by name: in this monorepo it is linked to its
// sources by `preconstruct dev`, whose ESM entry stub (the one Babel would import) doesn't load.
const require = createRequire(import.meta.url)

export default defineConfig({
  plugins: [
    react(),
    // Adds source locations to effects and sagas, so error logs can point at the saga that failed.
    babel({
      include: [path.join(import.meta.dirname, 'src/**')],
      plugins: [require('babel-plugin-redux-saga')],
    }),
  ],
})
