/**
 * Runtime regression test for issue #2088:
 * babel-plugin-redux-saga should not crash when a saga yields
 * a call expression that returns a primitive value.
 */
var babel7 = require('@babel/core')
var plugin = require('babel-plugin-redux-saga')
var path = require('path')

function transformAndEval(sourceCode) {
  var result = babel7.transformSync(sourceCode, {
    compact: false,
    filename: path.join(__dirname, 'runtime-test.js'),
    plugins: [plugin],
    cwd: path.join(__dirname, '..'),
  })
  // Execute the transformed code and return the generator
  var fn = new Function(result.code + '\nreturn foo;')
  return fn()
}

describe('runtime: primitive yield values (issue #2088)', function () {
  test('yield call expression returning a number should not crash', function () {
    var foo = transformAndEval(`
      function getNumber() { return 20 }
      function* foo() {
        yield getNumber()
      }
    `)
    var gen = foo()
    var result = gen.next()
    expect(result.value).toBe(20)
    expect(result.done).toBe(false)
  })

  test('yield call expression returning a string should not crash', function () {
    var foo = transformAndEval(`
      function getString() { return "hello" }
      function* foo() {
        yield getString()
      }
    `)
    var gen = foo()
    var result = gen.next()
    expect(result.value).toBe('hello')
    expect(result.done).toBe(false)
  })

  test('yield call expression returning null should not crash', function () {
    var foo = transformAndEval(`
      function getNull() { return null }
      function* foo() {
        yield getNull()
      }
    `)
    var gen = foo()
    var result = gen.next()
    expect(result.value).toBe(null)
    expect(result.done).toBe(false)
  })

  test('yield call expression returning undefined should not crash', function () {
    var foo = transformAndEval(`
      function getUndefined() { return undefined }
      function* foo() {
        yield getUndefined()
      }
    `)
    var gen = foo()
    var result = gen.next()
    expect(result.value).toBe(undefined)
    expect(result.done).toBe(false)
  })

  test('yield call expression returning boolean should not crash', function () {
    var foo = transformAndEval(`
      function getBool() { return true }
      function* foo() {
        yield getBool()
      }
    `)
    var gen = foo()
    var result = gen.next()
    expect(result.value).toBe(true)
    expect(result.done).toBe(false)
  })

  test('yield call expression returning an object should still get location metadata', function () {
    var foo = transformAndEval(`
      function getObj() { return { type: 'CALL' } }
      function* foo() {
        yield getObj()
      }
    `)
    var gen = foo()
    var result = gen.next()
    expect(result.value.type).toBe('CALL')
    expect(result.value['@@redux-saga/LOCATION']).toBeDefined()
    expect(result.value['@@redux-saga/LOCATION'].fileName).toBeDefined()
    expect(result.value['@@redux-saga/LOCATION'].lineNumber).toBeDefined()
    expect(result.done).toBe(false)
  })
})
