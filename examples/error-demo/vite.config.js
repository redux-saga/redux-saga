import { defineConfig } from 'vite'
import reduxSaga from '@redux-saga/unplugin/vite'

export default defineConfig({
  // Adds file names and line numbers to saga stacks in development.
  plugins: [reduxSaga()],
  // React 16 has no automatic JSX runtime, so compile JSX to React.createElement.
  oxc: {
    jsx: { runtime: 'classic' },
  },
  server: {
    port: 3000,
  },
})
