import { transform, unplugin, type Options } from '@redux-saga/unplugin'

const options: Options = { include: /src/ }
unplugin.vite(options)
unplugin.esbuild(options)

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
