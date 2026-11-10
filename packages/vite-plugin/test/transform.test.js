import { describe, test, expect } from 'vitest'
import { SourceMapConsumer } from 'source-map'
import { transform } from '@redux-saga/vite-plugin'

const LOCATION = '@@redux-saga/LOCATION'
const id = '/project/src/sagas.js'
const run = (code, file = id) => transform(code, file, { cwd: '/project' })

function evaluate(code, returnName) {
  return new Function(run(code).code + `\nreturn ${returnName};`)()
}

describe('runtime', () => {
  test.each([
    ['number', 20],
    ['string', 'hello'],
    ['null', null],
    ['undefined', undefined],
    ['boolean', true],
  ])('yielding a call that returns a %s does not crash (issue #2088)', (_, value) => {
    const saga = evaluate(
      `function get() { return ${JSON.stringify(value) ?? 'undefined'} }\nfunction* saga() { yield get() }`,
      'saga',
    )
    expect(saga().next().value).toBe(value)
  })

  test('objects and sagas get location metadata', () => {
    const saga = evaluate(
      `function getObj() { return { type: 'CALL' } }\n\nfunction* saga() {\n  yield getObj()\n}`,
      'saga',
    )
    expect(saga[LOCATION]).toEqual({ fileName: 'src/sagas.js', lineNumber: 3, code: null })
    expect(saga().next().value[LOCATION]).toEqual({ fileName: 'src/sagas.js', lineNumber: 4, code: 'getObj()' })
  })

  test('yields inside object and class methods are wrapped, the methods themselves are not', () => {
    const out = evaluate(
      `const obj = { *m() { yield Object() } }\nclass C { *g() { yield Object() } }\nconst out = { obj, C }`,
      'out',
    )
    expect(out.obj.m[LOCATION]).toBeUndefined()
    expect(out.obj.m().next().value[LOCATION].lineNumber).toBe(1)
    expect(new out.C().g().next().value[LOCATION].lineNumber).toBe(2)
  })

  test('nested wrappers that end at the same offset close in the right order', () => {
    const saga = evaluate(`function* saga() { yield Object(null) && function* inner() {} }`, 'saga')
    const value = saga().next().value
    expect(value.name).toBe('inner')
    // the function expression's own location wins over the yield's
    expect(value[LOCATION]).toEqual({
      fileName: 'src/sagas.js',
      lineNumber: 1,
      code: 'function* inner() {}',
    })
  })

  test('yielding the same object twice does not throw', () => {
    const saga = evaluate(
      `const effect = {}\nfunction get() { return effect }\nfunction* saga() {\n  yield get()\n  yield get()\n}`,
      'saga',
    )
    const gen = saga()
    expect(gen.next().value[LOCATION].lineNumber).toBe(4)
    expect(() => gen.next()).not.toThrow()
  })
})

describe('output', () => {
  test('returns null for files without sagas or with syntax errors', () => {
    expect(run('const a = 1')).toBeNull()
    expect(run('function* broken( {')).toBeNull()
    expect(run('function notASaga() { return "yield" }')).toBeNull()
  })

  test('keeps every source line on the same line', () => {
    const source = `import { call } from 'redux-saga/effects'\n\nexport function* a() {\n  yield call(b)\n}\n\nexport default function* c() {\n  const fn = function* () {\n    yield call(a)\n  }\n}\n`
    const { code } = run(source)
    const lines = code.split('\n')
    source.split('\n').forEach((line, i) => {
      if (line.trim()) expect(lines[i]).toContain(line.trim().split(' ')[0])
    })
    expect(lines[3]).toMatch(/^ {2}yield _extendSagaSourceLocation\(call\(b\)/)
  })

  test('produces a source map that points back at the original code', async () => {
    const source = `function* saga() {\n  yield call(foo)\n}\n`
    const { code, map } = run(source)
    const consumer = await new SourceMapConsumer(map)
    const line = code.split('\n')[1]
    const column = line.indexOf('call(foo)')
    expect(consumer.originalPositionFor({ line: 2, column })).toMatchObject({ line: 2, column: 8 })
  })

  test('skips anonymous default exports instead of crashing', () => {
    const { code } = run('export default function* () { yield call(x) }')
    expect(code).not.toMatch(/defineProperty\(undefined/)
    expect(code).toContain('_extendSagaSourceLocation(call(x)')
  })

  test('picks a helper name that does not collide with the file', () => {
    const { code } = run('const _extendSagaSourceLocation = 1\nfunction* s() { yield call(x) }')
    expect(code).toContain('_extendSagaSourceLocation2(call(x)')
    expect(code).toContain('function _extendSagaSourceLocation2(')
  })

  test('handles TypeScript and TSX before types are stripped', () => {
    const ts = run(
      `function* s(): Generator<unknown> {\n  const r = yield call<number>(fn as any)\n}`,
      '/project/src/s.ts',
    )
    expect(ts.code).toContain('code: "call<number>(fn as any)"')
    const tsx = run(`const C = () => <div />\nfunction* s() {\n  yield call(render, <C />)\n}`, '/project/src/s.tsx')
    expect(tsx.code).toContain('lineNumber: 3, code: "call(render, <C />)"')
  })

  test('useAbsolutePath reports the full module id', () => {
    const { code } = transform('function* s() {}', id, { useAbsolutePath: true })
    expect(code).toContain(`fileName: "${id}"`)
  })
})
