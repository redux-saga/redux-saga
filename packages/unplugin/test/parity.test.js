/**
 * Parity with babel-plugin-redux-saga: every Babel fixture must produce the same set of
 * location records ({ fileName, lineNumber, code }) when run through the native transform.
 * Output formatting differs (Babel re-prints, we edit in place), so records are compared
 * instead of text.
 */
import { describe, test, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { transformSync } from '@babel/core'
import { parseSync, visitorKeys } from 'oxc-parser'
import babelPlugin from 'babel-plugin-redux-saga'
import { transform } from '@redux-saga/unplugin'

const babelPackageDir = path.join(import.meta.dirname, '..', '..', 'babel-plugin-redux-saga')
const fixturesDir = path.join(babelPackageDir, 'test', 'fixtures')

function collectLocations(code, filename = 'out.js') {
  const records = []
  const visit = (node) => {
    if (node.type === 'ObjectExpression') {
      const props = Object.fromEntries(
        node.properties
          .filter((p) => p.type === 'Property' && p.key.type === 'Identifier')
          .map((p) => [p.key.name, p.value]),
      )
      if (props.fileName && props.lineNumber && props.code) {
        records.push({ fileName: props.fileName.value, lineNumber: props.lineNumber.value, code: props.code.value })
      }
    }
    for (const key of visitorKeys[node.type] || []) {
      const child = node[key]
      for (const item of Array.isArray(child) ? child : [child]) {
        if (item && typeof item.type === 'string') visit(item)
      }
    }
  }
  visit(parseSync(filename, code, { sourceType: 'module' }).program)
  return records.sort((a, b) => a.lineNumber - b.lineNumber || String(a.code).localeCompare(String(b.code)))
}

function runBabel(sourcePath, pluginOptions) {
  return transformSync(fs.readFileSync(sourcePath, 'utf8'), {
    babelrc: false,
    configFile: false,
    filename: sourcePath,
    cwd: babelPackageDir,
    plugins: [[babelPlugin, pluginOptions]],
  }).code
}

// Babel re-prints `code` snippets for some nodes; normalize trivial formatting differences.
const normalizeCode = (record) => ({
  ...record,
  code: record.code && record.code.replace(/\s+/g, ' ').replace(/,\s*([}\])])/g, '$1'),
})

const fixtures = fs
  .readdirSync(fixturesDir)
  .filter((name) => name !== 'typescript')
  .map((name) => [name, name === 'use-absolute-path' ? { useAbsolutePath: true } : {}])

describe('parity with babel-plugin-redux-saga', () => {
  test.each(fixtures)('%s', (fixture, options) => {
    const sourcePath = path.join(fixturesDir, fixture, 'source.js')
    const expected = collectLocations(runBabel(sourcePath, options))
    const actual = collectLocations(
      transform(fs.readFileSync(sourcePath, 'utf8'), sourcePath, { cwd: babelPackageDir, ...options }).code,
    )
    expect(expected.length).toBeGreaterThan(0)
    expect(actual.map(normalizeCode)).toEqual(expected.map(normalizeCode))
  })

  test('typescript: reads the .ts source directly, line numbers match the source-mapped Babel run', () => {
    const fixtureDir = path.join(fixturesDir, 'typescript')
    const jsPath = path.join(fixtureDir, 'source.js')
    const babelOutput = transformSync(fs.readFileSync(jsPath, 'utf8'), {
      babelrc: false,
      configFile: false,
      filename: jsPath,
      cwd: babelPackageDir,
      inputSourceMap: JSON.parse(fs.readFileSync(jsPath + '.map', 'utf8')),
      plugins: [babelPlugin],
    }).code

    const tsPath = path.join(fixtureDir, 'source.ts')
    const actual = collectLocations(
      transform(fs.readFileSync(tsPath, 'utf8'), tsPath, { cwd: babelPackageDir }).code,
      'out.ts',
    )

    expect(actual.map((r) => r.lineNumber)).toEqual(collectLocations(babelOutput).map((r) => r.lineNumber))
    expect(actual.every((r) => r.fileName === 'test/fixtures/typescript/source.ts')).toBe(true)
  })
})
