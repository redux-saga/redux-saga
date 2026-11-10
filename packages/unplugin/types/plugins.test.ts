import { transform, unplugin, type Options } from '@redux-saga/unplugin'
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
unplugin.vite(options)

// @ts-expect-error unknown option
vite({ unknown: true })
// @ts-expect-error include takes strings or RegExps
vite({ include: 1 })
// @ts-expect-error enabled is a boolean
webpack({ enabled: 'yes' })

const result = transform('function* saga() {}', '/project/saga.js', {
  cwd: '/project',
  onParseError: (error) => console.warn(error.message),
})
if (result) {
  const code: string = result.code
  const mappings: string = result.map.mappings
}
// @ts-expect-error transform returns null when nothing changed
const notNull: { code: string } = transform('', 'a.js')
