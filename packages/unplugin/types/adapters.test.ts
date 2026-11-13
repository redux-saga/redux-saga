// Checked with `skipLibCheck: false`: an adapter's types may only need its own bundler.
import type { Options } from '@redux-saga/unplugin/vite'
import vite from '@redux-saga/unplugin/vite'
import rollup from '@redux-saga/unplugin/rollup'
import rolldown from '@redux-saga/unplugin/rolldown'
import webpack from '@redux-saga/unplugin/webpack'
import rspack from '@redux-saga/unplugin/rspack'
import esbuild from '@redux-saga/unplugin/esbuild'

const options: Options = {
  include: ['/src/sagas/', /\.saga\.ts$/],
  exclude: '/legacy/',
  cwd: '/project',
  useAbsolutePath: false,
  enabled: true,
}

vite()
vite(options)
rollup({ include: /src/ })
rolldown({ exclude: ['a', /b/] })
webpack({ enabled: false })
rspack({ cwd: '.' })
esbuild({ useAbsolutePath: true })

// @ts-expect-error unknown option
vite({ unknown: true })
// @ts-expect-error include takes strings or RegExps
vite({ include: 1 })
// @ts-expect-error enabled is a boolean
webpack({ enabled: 'yes' })
