import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import reduxSaga from '@redux-saga/unplugin/vite'

export default defineConfig({
  plugins: [
    // Adds source locations to effects and sagas, so error logs can point at the saga that failed.
    reduxSaga(),
    react(),
  ],
})
