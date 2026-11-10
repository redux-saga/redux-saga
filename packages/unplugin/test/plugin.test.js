import { createRequire } from 'node:module'
import { describe, test, expect, afterEach } from 'vitest'
import { unplugin } from '@redux-saga/unplugin'

const originalNodeEnv = process.env.NODE_ENV
afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv
})

const create = (options, framework) => unplugin.raw(options, { framework })
const file = '/project/src/sagas.js'
const saga = 'function* saga() {\n  yield call(fn)\n}'

describe('when the plugin runs', () => {
  describe.each(['webpack', 'rspack'])('%s', (framework) => {
    const withMode = (mode, options = {}) => {
      const plugin = create(options, framework)
      plugin[framework]({ options: { mode, context: '/project' } })
      return plugin
    }

    test('mode: production switches it off even when NODE_ENV says development', () => {
      process.env.NODE_ENV = 'development'
      expect(withMode('production').transformInclude(file)).toBe(false)
    })

    test('mode: development switches it on even when NODE_ENV says production', () => {
      process.env.NODE_ENV = 'production'
      expect(withMode('development').transformInclude(file)).toBe(true)
    })

    test('no mode means a production build, whatever NODE_ENV says', () => {
      process.env.NODE_ENV = 'production'
      expect(withMode(undefined).transformInclude(file)).toBe(false)
      process.env.NODE_ENV = 'development'
      expect(withMode(undefined).transformInclude(file)).toBe(false)
      expect(withMode('none').transformInclude(file)).toBe(true)
    })

    test('the enabled option wins over mode', () => {
      expect(withMode('production', { enabled: true }).transformInclude(file)).toBe(true)
      expect(withMode('development', { enabled: false }).transformInclude(file)).toBe(false)
    })

    test('file names are relative to the compiler context', () => {
      const plugin = create({}, framework)
      plugin[framework]({ options: { mode: 'development', context: '/project/src' } })
      expect(plugin.transform.handler(saga, file).code).toContain('fileName: "sagas.js"')
    })
  })

  test('vite: follows isProduction, whatever the mode', () => {
    const resolve = (config) => {
      const plugin = create({}, 'vite')
      plugin.vite.configResolved({ root: '/project', ...config })
      return plugin.transformInclude(file)
    }
    expect(resolve({ command: 'serve', mode: 'development', isProduction: false })).toBe(true)
    expect(resolve({ command: 'build', mode: 'development', isProduction: false })).toBe(true)
    expect(resolve({ command: 'build', mode: 'staging', isProduction: true })).toBe(false)
    expect(resolve({ command: 'build', mode: 'production', isProduction: true })).toBe(false)
  })

  test('other bundlers follow NODE_ENV', () => {
    process.env.NODE_ENV = 'production'
    expect(create({}, 'rollup').transformInclude(file)).toBe(false)
    process.env.NODE_ENV = 'development'
    expect(create({}, 'rollup').transformInclude(file)).toBe(true)
  })

  test('skips node_modules, non-script files and virtual modules', () => {
    const plugin = create({ enabled: true }, 'rollup')
    expect(plugin.transformInclude('/project/node_modules/lib/index.js')).toBe(false)
    expect(plugin.transformInclude('/project/src/styles.css')).toBe(false)
    expect(plugin.transformInclude('\0virtual:sagas.js')).toBe(false)
    expect(plugin.transformInclude('/project/src/App.tsx?v=123')).toBe(true)
  })

  test('include and exclude strings match Windows paths', () => {
    const plugin = create({ enabled: true, include: '/src/sagas/', exclude: ['/src/sagas/legacy/'] }, 'webpack')
    expect(plugin.transformInclude('C:\\project\\src\\sagas\\index.js')).toBe(true)
    expect(plugin.transformInclude('C:\\project\\src\\sagas\\legacy\\old.js')).toBe(false)
    expect(plugin.transformInclude('C:\\project\\src\\other.js')).toBe(false)
  })

  test('the native transform filter only lets through what transformInclude could accept', () => {
    const { filter } = create({}, 'vite').transform
    const passes = (id, code = 'function* saga() {}') =>
      filter.id.include.some((r) => r.test(id)) && !filter.id.exclude.some((r) => r.test(id)) && filter.code.test(code)
    expect(passes('/project/src/sagas.js')).toBe(true)
    expect(passes('/project/src/App.tsx?v=123')).toBe(true)
    expect(passes('/project/src/legacy.cjs', 'exports.x = 1; yield')).toBe(true)
    expect(passes('/project/src/plain.js', 'export const x = 1')).toBe(false)
    expect(passes('/project/node_modules/lib/index.js')).toBe(false)
    expect(passes('C:\\project\\node_modules\\lib\\index.js')).toBe(false)
    expect(passes('\0virtual:sagas.js')).toBe(false)
    expect(passes('/project/src/styles.css')).toBe(false)
  })

  test('global and sticky RegExps match the same way on every call', () => {
    const plugin = create({ include: /sagas/g, exclude: /\/project\/src\/legacy/y })
    for (let i = 0; i < 3; i++) {
      expect(plugin.transformInclude('/project/src/sagas.js')).toBe(true)
      expect(plugin.transformInclude('/project/src/sagas/legacy.js')).toBe(true)
      expect(plugin.transformInclude('/project/src/legacy/sagas.js')).toBe(false)
    }
  })

  test('warns once per file that cannot be parsed', () => {
    const plugin = create({ enabled: true }, 'rollup')
    const warnings = []
    const context = { warn: (message) => warnings.push(message) }
    const flow = '// @flow\nfunction* s(): Saga<void> { yield call(x) }'
    expect(plugin.transform.handler.call(context, flow, '/project/src/flow.js')).toBeNull()
    expect(plugin.transform.handler.call(context, flow, '/project/src/flow.js')).toBeNull()
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatch(/^\[redux-saga\] skipped \/project\/src\/flow\.js, which could not be parsed/)
  })
})

describe('package entry points', () => {
  const bundlers = ['vite', 'rollup', 'rolldown', 'webpack', 'rspack', 'esbuild']
  const require = createRequire(import.meta.url)

  test.each(bundlers)('@redux-saga/unplugin/%s loads with import and require', async (bundler) => {
    const imported = await import(/* @vite-ignore */ `@redux-saga/unplugin/${bundler}`)
    expect(typeof imported.default).toBe('function')
    expect(typeof require(`@redux-saga/unplugin/${bundler}`).default).toBe('function')
  })
})
