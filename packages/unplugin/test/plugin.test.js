import { createRequire } from 'node:module'
import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'esbuild'
import esbuildPlugin from '@redux-saga/unplugin/esbuild'
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

describe('esbuild', () => {
  let dir
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = undefined
  })
  const bundle = async (files, options) => {
    dir = realpathSync(mkdtempSync(join(tmpdir(), 'redux-saga-unplugin-')))
    for (const [name, contents] of Object.entries(files)) writeFileSync(join(dir, name), contents)
    const result = await build({
      absWorkingDir: dir,
      entryPoints: ['entry.js'],
      bundle: true,
      write: false,
      format: 'esm',
      logLevel: 'silent',
      ...options,
    })
    return { ...result, text: result.outputFiles.find((file) => !file.path.endsWith('.map')).text }
  }
  const sagaFile = 'export function* saga() {\n  yield call(fn)\n}'

  test('adds locations, with file names relative to the working directory', async () => {
    const { text } = await bundle({ 'entry.js': sagaFile }, { plugins: [esbuildPlugin({ enabled: true })] })
    expect(text).toContain('fileName: "entry.js", lineNumber: 2, code: "call(fn)"')
  })

  test('keeps the loader the build configured for the file', async () => {
    const files = { 'entry.js': `${sagaFile}\nexport const element = <div />` }
    const options = { loader: { '.js': 'jsx' }, jsx: 'preserve' }
    await expect(bundle(files, options)).resolves.toBeDefined()
    const { text } = await bundle(files, { ...options, plugins: [esbuildPlugin({ enabled: true })] })
    expect(text).toContain('<div />')
    expect(text).toContain('@@redux-saga/LOCATION')
  })

  test('leaves files alone when the build loads them as something other than a script', async () => {
    const files = { 'entry.js': 'import text from "./saga.txt.js"\nexport default text', 'saga.txt.js': sagaFile }
    const { text } = await bundle(files, {
      loader: { '.js': 'text' },
      entryPoints: ['entry.js'],
      plugins: [esbuildPlugin({ enabled: true })],
    }).catch(() => ({ text: null }))
    expect(text).not.toBeNull()
    expect(text).not.toContain('@@redux-saga/LOCATION')
  })

  test('leaves modules that another plugin serves from its own namespace to that plugin', async () => {
    const virtual = {
      name: 'virtual',
      setup(build) {
        build.onResolve({ filter: /^virtual:generated$/ }, () => ({ path: 'generated.js', namespace: 'generated' }))
        build.onLoad({ filter: /.*/, namespace: 'generated' }, () => ({ contents: sagaFile, loader: 'js' }))
      },
    }
    const { text } = await bundle(
      { 'entry.js': 'export { saga } from "virtual:generated"' },
      { plugins: [esbuildPlugin({ enabled: true }), virtual] },
    )
    expect(text).toContain('function* saga()')
    expect(text).not.toContain('@@redux-saga/LOCATION')
  })

  test('maps the output back to the original source', async () => {
    const { outputFiles } = await bundle(
      { 'entry.js': sagaFile },
      { plugins: [esbuildPlugin({ enabled: true })], sourcemap: 'external', outfile: 'out.js' },
    )
    const map = JSON.parse(outputFiles.find((file) => file.path.endsWith('.map')).text)
    expect(map.sourcesContent).toEqual([sagaFile])
  })

  test('reports files it cannot parse as build warnings', async () => {
    const { warnings } = await bundle(
      { 'entry.js': 'import "./flow.js"', 'flow.js': 'function* saga(a: number) {}' },
      { plugins: [esbuildPlugin({ enabled: true })] },
    ).catch((error) => error)
    expect(warnings.map((warning) => warning.text).join()).toContain('could not be parsed')
  })

  test('does nothing in production', async () => {
    process.env.NODE_ENV = 'production'
    const { text } = await bundle({ 'entry.js': sagaFile }, { plugins: [esbuildPlugin()] })
    expect(text).not.toContain('@@redux-saga/LOCATION')
  })
})
