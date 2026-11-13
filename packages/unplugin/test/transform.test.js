import { describe, test, expect } from 'vitest'
import { SourceMapConsumer } from 'source-map'
import ts from 'typescript'
import { transform } from '@redux-saga/unplugin'

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

  test('a short-circuited optional call yields undefined', () => {
    const saga = evaluate(`const api = null\nfunction* saga() {\n  yield api?.fetch()\n}`, 'saga')
    expect(saga().next().value).toBeUndefined()
  })

  test('a conditional yield tags whichever branch was taken, and passes primitives through', () => {
    const saga = evaluate(`function make() { return {} }\nfunction* saga(flag) {\n  yield flag ? make() : 0\n}`, 'saga')
    expect(saga(true).next().value[LOCATION]).toMatchObject({ lineNumber: 3, code: 'flag ? make() : 0' })
    expect(saga(false).next().value).toBe(0)
  })

  test('generator function expressions keep the name JavaScript infers for them', () => {
    const out = evaluate(
      [
        'const dynamic = "dyn", fromKey = 1',
        'const fromConst = function* () {}',
        'let assigned; assigned = function* () {}',
        'const obj = { fromKey: function* () {}, "string key": function* () {}, ["computed"]: function* () {}, [dynamic]: function* () {} }',
        'class C { static field = function* () {}; static #priv = function* () {}; static priv() { return C.#priv } }',
        'function withDefault(fromDefault = function* () {}) { return fromDefault }',
        'const named = function* explicit() {}',
        'const passed = [function* () {}][0]',
        'const out = { fromConst, assigned, obj, C, withDefault, named, passed }',
      ].join('\n'),
      'out',
    )
    expect(out.fromConst.name).toBe('fromConst')
    expect(out.assigned.name).toBe('assigned')
    expect(out.obj.fromKey.name).toBe('fromKey')
    expect(out.obj['string key'].name).toBe('string key')
    expect(out.obj.computed.name).toBe('computed')
    // the name of a dynamic key is only known at runtime
    expect(out.obj.dyn.name).toBe('')
    expect(out.C.field.name).toBe('field')
    expect(out.C.priv().name).toBe('#priv')
    expect(out.withDefault().name).toBe('fromDefault')
    expect(out.named.name).toBe('explicit')
    expect(out.passed.name).toBe('')
    expect(out.fromConst[LOCATION]).toMatchObject({ lineNumber: 2 })
  })

  test.each([
    ['frozen', 'Object.freeze({})'],
    ['sealed', 'Object.seal([])'],
    ['non-extensible', 'Object.preventExtensions({})'],
  ])('yielding a %s object does not throw', (_, expression) => {
    const saga = evaluate(`function get() { return ${expression} }\nfunction* saga() { yield get() }`, 'saga')
    const value = saga().next().value
    expect(value[LOCATION]).toBeUndefined()
  })

  test.each([
    ['throws', '() => { throw new Error("no defineProperty on a draft") }'],
    ['returns false', '() => false'],
  ])('yielding a Proxy whose defineProperty trap %s does not throw', (_, trap) => {
    const saga = evaluate(
      `const proxy = new Proxy({}, { defineProperty: ${trap} })\nfunction get() { return proxy }\nfunction* saga() { yield get() }`,
      'saga',
    )
    expect(() => saga().next()).not.toThrow()
  })

  test('declarations whose binding was reassigned or redeclared do not throw', () => {
    expect(() => evaluate('reassigned = 5\nfunction* reassigned() {}\nconst out = reassigned', 'out')).not.toThrow()
    const twice = evaluate('function* twice() {}\nfunction* twice() { yield 1 }\nconst out = twice', 'out')
    expect(twice[LOCATION]).toMatchObject({ lineNumber: 2 })
    const nested = evaluate(
      'function outer() {\n  function* twice() {}\n  function* twice() { yield 1 }\n  return twice\n}\nconst out = outer()',
      'out',
    )
    expect(nested[LOCATION]).toMatchObject({ lineNumber: 3 })
  })

  test.each([
    ['an array', 'yield[make()].map((x) => x)'],
    ['a template literal', 'yield`a`.concat(make().type)'],
    ['a regular expression', 'yield/a/.exec(make().type)'],
    ['a string', "yield'a'.concat(make().type)"],
  ])('a yield written right against %s still runs', (_, statement) => {
    const saga = evaluate(`function make() { return { type: 'a' } }\nfunction* saga() { ${statement} }`, 'saga')
    expect(() => saga().next()).not.toThrow()
    expect(run(`function* saga() { ${statement} }`).code).toContain('yield _extendSagaSourceLocation(')
  })

  test.each([
    ['after a return', 'function makeSaga() {\n  return worker\n  function* worker() {}\n}\nconst out = makeSaga()', 3],
    ['before its line runs', 'const out = saga\nfunction* saga() {}', 2],
    ['in a block', 'let out\n{\n  out = inner\n  function* inner() {}\n}', 4],
    [
      'in a function with directives',
      "function f() {\n  'use strict'\n  return inner\n  function* inner() {}\n}\nconst out = f()",
      4,
    ],
    ['in a static block', 'let out\nclass C {\n  static {\n    out = inner\n    function* inner() {}\n  }\n}', 5],
  ])('a hoisted declaration used %s has its location', (_, code, lineNumber) => {
    expect(evaluate(code, 'out')[LOCATION]).toMatchObject({ lineNumber })
  })

  test('annotations do not come between a statement and the comment above it', () => {
    const { code } = run(
      "// @ts-check\n'use strict'\nimport a from 'a'\n/** @type {number} */\nconst n = 1\nfunction outer() {\n  /** @type {number} */\n  const m = 2\n  function* inner() {}\n}\nexport function* saga() {}",
    )
    const lines = code.split('\n')
    expect(lines[0]).toBe('// @ts-check')
    expect(lines[1]).toBe("'use strict'")
    expect(lines[2]).toMatch(/^import a from 'a';_extendSagaSourceLocation\(saga, /)
    expect(lines.slice(3, 5)).toEqual(['/** @type {number} */', 'const n = 1'])
    expect(lines[5]).toMatch(/^function outer\(\) \{_extendSagaSourceLocation\(inner, /)
    expect(lines.slice(6, 8)).toEqual(['  /** @type {number} */', '  const m = 2'])
  })

  test('a file that opens with documented code keeps its JSDoc and pragmas in place', () => {
    const body = 'export const twice = (n) => n * 2\nexport function* saga() {}'
    const lines = (source) => run(source).code.split('\n')
    const after = /^export const twice = \(n\) => n \* 2;_extendSagaSourceLocation\(saga, /
    expect(lines(`/** @param {number} n */\n${body}`).slice(0, 2)).toEqual([
      '/** @param {number} n */',
      expect.stringMatching(after),
    ])
    expect(lines(`// @ts-check\n/** @param {number} n */\n${body}`).slice(0, 3)).toEqual([
      '// @ts-check',
      '/** @param {number} n */',
      expect.stringMatching(after),
    ])
    for (const block of ['/** @jsx h */', '/**\n * @license MIT\n * @param {number} n\n */']) {
      const output = lines(`${block}\n${body}`)
      expect(output.slice(0, -1).join('\n')).toContain(`${block}\nexport const twice = (n) => n * 2;_extend`)
    }
    for (const comment of ['/* plain */', '// @ts-nocheck']) {
      const output = lines(`${comment}\n${body}`)
      expect(output[0]).toBe(comment)
      expect(output[1]).toMatch(/^_extendSagaSourceLocation\(saga, .*export const twice/)
    }
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

  test.each([
    ['a block comment', `function /* worker */ * saga() { throw new Error('failed') }`],
    ['a line comment', `function // worker\n* saga() { throw new Error('failed') }`],
    ['an expression', `const saga = function /* worker */ * () { throw new Error('failed') }`],
  ])('a generator without yield is found behind %s before the asterisk', (_, code) => {
    expect(evaluate(code, 'saga')[LOCATION]).toMatchObject({ fileName: 'src/sagas.js', lineNumber: 1 })
  })

  test.each([
    ['LF', '\n'],
    ['CRLF', '\r\n'],
    ['a lone CR', '\r'],
    ['U+2028', ' '],
    ['U+2029', ' '],
  ])('line numbers count %s as one line break', (_, eol) => {
    const saga = evaluate(
      ['// header', 'function get() { return {} }', '', 'function* saga() {', '  yield get()', '}'].join(eol),
      'saga',
    )
    expect(saga[LOCATION].lineNumber).toBe(4)
    expect(saga().next().value[LOCATION].lineNumber).toBe(5)
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

  test('keeps a trailing sourceMappingURL comment last', () => {
    for (const comment of [
      '//# sourceMappingURL=saga.js.map',
      '//@ sourceMappingURL=data:application/json;base64,e30=',
    ]) {
      for (const source of [`function* a() {}\n${comment}\n`, `function* a() {}${comment}`]) {
        const { code } = run(source)
        expect(code.trimEnd().endsWith(comment)).toBe(true)
        expect(code.indexOf('function _extendSagaSourceLocation')).toBeLessThan(code.indexOf(comment))
        expect(code.split(comment)).toHaveLength(2)
      }
    }
  })

  test('ignores text that only looks like a sourceMappingURL comment', () => {
    const source = 'function* a() {}\nexport const s = `\n//# sourceMappingURL=foo`'
    const { code } = run(source)
    expect(code).toContain('export const s = `\n//# sourceMappingURL=foo`\n/**\n * @template T')
  })

  test('skips files nested too deeply to walk instead of failing the build', () => {
    const errors = []
    const deep = `function* s() { yield call(x) }\nconst n = ${'1+'.repeat(30000)}1`
    expect(transform(deep, id, { onParseError: (error) => errors.push(error) })).toBeNull()
    expect(errors).toEqual([{ message: expect.stringContaining('nested too deeply') }])
  })

  test('TypeScript output passes a strict type check and keeps the yielded type', () => {
    const source = [
      'declare function call<T>(fn: () => T): { effect: T }',
      'declare const api: { fetch(): number } | undefined',
      'export function* saga() {',
      '  const a: number = yield call(() => 1)',
      '  yield api?.fetch()',
      '  yield (call(() => "x") as { effect: string })',
      '}',
      'export const expr = function* () { yield call(() => true) }',
      'const first: { effect: number } | number | { effect: string } | { effect: boolean } | void = saga().next().value',
      'const name: string = expr.name',
      '// @ts-expect-error the yielded type is kept, not widened to any',
      'const wrong: string = saga().next().value',
      'export { first, name, wrong }',
    ].join('\n')
    // One program for all three files, so the standard library is only loaded once.
    const outputs = new Map(
      ['/project/src/sagas.ts', '/project/src/sagas.tsx', '/project/src/sagas.mts'].map((file) => [
        file,
        run(source, file).code,
      ]),
    )
    const host = ts.createCompilerHost({})
    const getSourceFile = host.getSourceFile
    host.getSourceFile = (name, ...rest) =>
      outputs.has(name)
        ? ts.createSourceFile(name, outputs.get(name), ts.ScriptTarget.ES2022)
        : getSourceFile(name, ...rest)
    const program = ts.createProgram(
      [...outputs.keys()],
      {
        strict: true,
        noEmit: true,
        noUnusedParameters: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.NodeNext,
        jsx: ts.JsxEmit.Preserve,
        types: [],
      },
      host,
    )
    expect(program.getSourceFiles().filter((file) => outputs.has(file.fileName))).toHaveLength(3)
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
    expect(diagnostics).toEqual([])
    // Type-checking loads TypeScript's standard library, which is slow on CI machines.
  }, 60_000)

  test('JavaScript output passes a strict checkJs type check and keeps the yielded type', () => {
    const file = '/project/src/sagas.js'
    const output = run(
      [
        '/**',
        ' * @license MIT',
        ' * @param {number} n',
        ' */',
        '/* istanbul ignore next */',
        '// a note',
        'export const twice = (n) => n * 2',
        '/** @param {number} n */',
        'function make(n) { return { effect: n } }',
        'export function* saga() { yield make(1) }',
        'export const expr = function* () { yield make(2) }',
        '/** @type {{ effect: number } | void} */',
        'export const first = saga().next().value',
        '// @ts-expect-error the yielded type is kept, not widened to any',
        '/** @type {string} */ export const wrong = saga().next().value',
      ].join('\n'),
      file,
    ).code
    const host = ts.createCompilerHost({})
    const getSourceFile = host.getSourceFile
    host.getSourceFile = (name, ...rest) =>
      name === file ? ts.createSourceFile(name, output, ts.ScriptTarget.ES2022) : getSourceFile(name, ...rest)
    const program = ts.createProgram(
      [file],
      {
        strict: true,
        allowJs: true,
        checkJs: true,
        noEmit: true,
        noUnusedParameters: true,
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.NodeNext,
        types: [],
      },
      host,
    )
    const diagnostics = ts
      .getPreEmitDiagnostics(program)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'))
    expect(diagnostics).toEqual([])
  }, 60_000)

  test.each([
    ['directly', 'new function* () {}'],
    ['through member access', 'new function* () {}.bind(null)'],
    ['through a tagged template', 'new function* () {}`x`'],
  ])('a generator constructed %s still throws', (_, expression) => {
    const { code } = run(`function* saga() { yield call(a) }\nexport const make = () => ${expression}`)
    expect(code).toContain('new (_extendSagaSourceLocation(function* () {}')
    expect(() => new Function(code.replace('export ', '') + '\nreturn make()')()).toThrow(TypeError)
  })

  test('the lang option decides the syntax parsed and emitted, whatever the file is called', () => {
    const plain = 'export function* saga() { yield call(a) }'
    const typed = 'export function* saga(n: number) { yield call(a) }'
    const asJs = transform(plain, '/project/src/sagas.ts', { lang: 'js' }).code
    expect(asJs).toContain('function _extendSagaSourceLocation(value, location, name)')
    expect(() => new Function(asJs.replace('export ', ''))).not.toThrow()
    expect(transform(typed, '/project/src/sagas.js', { lang: 'ts' }).code).toContain('<T>(value: T')
    expect(transform(typed, '/project/src/sagas.ts', { lang: 'js' })).toBeNull()
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

  test('picks a helper name that does not collide with an identifier written with escapes', () => {
    const saga = evaluate('const _extendSagaSourceLocatio\\u006e = 0\nfunction* saga() {}', 'saga')
    expect(saga[LOCATION]).toMatchObject({ lineNumber: 2 })
  })

  test('generator function expressions keep their inferred name behind TypeScript assertions', () => {
    const { code } = run(
      'const a = function* () {} as Saga\nconst b = (function* () {})!\nconst c = <Saga>function* () {}\nconst d = function* () {} satisfies Saga as Saga',
      '/project/src/sagas.ts',
    )
    for (const name of ['a', 'b', 'c', 'd'])
      expect(code).toMatch(new RegExp(`code: "function\\* \\(\\) \\{\\}" \\}, "${name}"\\)`))
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

  test('wraps optional calls, but not optional member access', () => {
    const { code } = run('function* s() {\n  yield api?.fetch()\n  yield maybe?.()\n  yield a?.b\n}')
    expect(code).toContain(
      '_extendSagaSourceLocation(api?.fetch(), { fileName: "src/sagas.js", lineNumber: 2, code: "api?.fetch()" })',
    )
    expect(code).toContain('_extendSagaSourceLocation(maybe?.(), {')
    expect(code).toContain('yield a?.b\n')
  })

  test('looks through TypeScript type assertions to the call inside', () => {
    const { code } = run(
      'function* s() {\n  yield call(a) as Effect\n  yield call(b) satisfies Effect\n  yield call(c)!\n  yield <Effect>call(d)\n}',
      '/project/src/s.ts',
    )
    expect(code).toContain(
      'yield _extendSagaSourceLocation(call(a), { fileName: "src/s.ts", lineNumber: 2, code: "call(a)" }) as Effect',
    )
    expect(code).toContain('yield _extendSagaSourceLocation(call(b), {')
    expect(code).toContain('lineNumber: 3, code: "call(b)" }) satisfies Effect')
    expect(code).toContain('lineNumber: 4, code: "call(c)" })!')
    expect(code).toContain('yield <Effect>_extendSagaSourceLocation(call(d), {')
  })

  test('wraps conditional yields when a branch is a call', () => {
    const { code } = run(
      'function* s() {\n  yield cond ? call(a) : call(b)\n  yield cond ? call(a) : null\n  yield cond ? effectA : effectB\n}',
    )
    expect(code).toContain(
      'yield _extendSagaSourceLocation(cond ? call(a) : call(b), { fileName: "src/sagas.js", lineNumber: 2, code: "cond ? call(a) : call(b)" })',
    )
    expect(code).toContain('lineNumber: 3, code: "cond ? call(a) : null" })')
    expect(code).toContain('yield cond ? effectA : effectB\n')
  })

  test('wraps optional calls behind a non-null assertion', () => {
    const { code } = run('function* s() {\n  yield a?.b()!\n}', '/project/src/s.ts')
    expect(code).toContain('yield _extendSagaSourceLocation(a?.b()!, {')
  })

  test('parses JSX in .js files and CommonJS files', () => {
    expect(run('function* s() {\n  yield call(render, <C />)\n}').code).toContain('code: "call(render, <C />)"')
    const commonjs = 'function* s() { yield call(x) }\nif (!module.parent) return\nmodule.exports = s'
    expect(run(commonjs).code).toContain('_extendSagaSourceLocation(call(x)')
    expect(run(commonjs, '/project/src/sagas.cjs').code).toContain('_extendSagaSourceLocation(call(x)')
  })

  test('reports files it cannot parse instead of failing silently', () => {
    const errors = []
    const onParseError = (error) => errors.push(error)
    const options = { cwd: '/project', onParseError }
    expect(transform('// @flow\nfunction* s(): Saga<void> { yield call(x) }', id, options)).toBeNull()
    expect(transform('function* s() { yield call(x) }\nreturn', '/project/src/sagas.mjs', options)).toBeNull()
    expect(errors).toHaveLength(2)
    expect(errors[0].message).toEqual(expect.any(String))
    expect(transform('const nothing = 1', id, options)).toBeNull()
    expect(errors).toHaveLength(2)
  })

  test('useAbsolutePath reports the full module id', () => {
    const { code } = transform('function* s() {}', id, { useAbsolutePath: true })
    expect(code).toContain(`fileName: "${id}"`)
  })
})
