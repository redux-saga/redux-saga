import { relative } from 'node:path'
import MagicString from 'magic-string'
import { parseSync, visitorKeys } from 'oxc-parser'

const SYMBOL_NAME = '@@redux-saga/LOCATION'
const HELPER_BASE_NAME = '_extendSagaSourceLocation'

// Cheap pre-check so files without generators are never parsed.
const MAYBE_SAGA = /\byield\b|function\s*\*/

export function mightContainSagas(code) {
  return MAYBE_SAGA.test(code)
}

export function getFileName(id, { cwd = process.cwd(), useAbsolutePath = false } = {}) {
  const fileName = useAbsolutePath ? id : relative(cwd, id)
  return fileName.replace(/\\/g, '/')
}

/**
 * Attaches `@@redux-saga/LOCATION` metadata to generator functions and to the values
 * they yield. Produces the same metadata as babel-plugin-redux-saga, but edits the
 * source text in place instead of re-printing it, so line numbers in the output match
 * the input and runs before TypeScript/JSX are stripped.
 *
 * Returns `null` when there is nothing to change or the file doesn't parse (the
 * bundler's own parser will then report the syntax error).
 */
export function transform(code, id, options = {}) {
  if (!mightContainSagas(code)) return null

  const result = parseSync(id, code, { sourceType: 'module', preserveParens: false })
  if (result.errors.length > 0) return null

  const fileName = JSON.stringify(getFileName(id, options))
  const lineOf = createLineLookup(code)
  const source = new MagicString(code)
  const helperName = pickHelperName(code)
  let helperUsed = false

  const location = (node, snippet) =>
    `{ fileName: ${fileName}, lineNumber: ${lineOf(node.start)}, code: ${
      snippet == null ? 'null' : JSON.stringify(snippet.replace(/\r/g, ''))
    } }`

  // Openings are inserted on enter and closings on exit, so when edits share an offset
  // (e.g. a wrapped function expression ending where a wrapped yield argument ends)
  // the inner wrapper is closed before the outer one.
  walk(result.program, null, (node, parent) => {
    switch (node.type) {
      case 'FunctionDeclaration': {
        // `export default function* () {}` has no binding to attach to.
        if (!node.generator || !node.id || !node.body) return
        const statement =
          parent && (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration')
            ? parent
            : node
        source.appendLeft(
          statement.end,
          `;Object.defineProperty(${node.id.name}, ${JSON.stringify(SYMBOL_NAME)}, { value: ${location(node)} });`,
        )
        return
      }
      case 'FunctionExpression': {
        if (!node.generator) return
        // Object and class methods are FunctionExpression values in ESTree; Babel models them
        // as ObjectMethod/ClassMethod, which the Babel plugin leaves alone.
        const isMethod =
          parent &&
          (parent.type === 'MethodDefinition' ||
            parent.type === 'TSAbstractMethodDefinition' ||
            (parent.type === 'Property' && (parent.method || parent.kind !== 'init')))
        if (isMethod) return
        // Wrapping in a call never needs extra parentheses: the call binds tighter
        // than anything the function expression could have been an operand of.
        const snippet = code.slice(node.start, node.end)
        source.appendRight(node.start, 'Object.defineProperty(')
        return () =>
          source.appendLeft(node.end, `, ${JSON.stringify(SYMBOL_NAME)}, { value: ${location(node, snippet)} })`)
      }
      case 'YieldExpression': {
        const argument = node.argument
        if (node.delegate || !argument) return
        if (argument.type !== 'CallExpression' && argument.type !== 'LogicalExpression') return
        helperUsed = true
        // A call argument accepts any AssignmentExpression, the same grammar as a
        // yield argument, so no parentheses are needed around the original text.
        const snippet = code.slice(argument.start, argument.end)
        source.appendRight(argument.start, `${helperName}(`)
        return () => source.appendLeft(argument.end, `, ${location(node, snippet)})`)
      }
    }
  })

  if (!source.hasChanged()) return null

  if (helperUsed) {
    // Function declarations are hoisted, so the helper can go at the very end. That keeps
    // it clear of hashbangs and directive prologues and leaves every source line in place.
    source.append(
      `\nfunction ${helperName}(value, location) { if (value !== null && (typeof value === 'object' || typeof value === 'function') && !Object.prototype.hasOwnProperty.call(value, ${JSON.stringify(
        SYMBOL_NAME,
      )})) { Object.defineProperty(value, ${JSON.stringify(SYMBOL_NAME)}, { value: location }); } return value; }\n`,
    )
  }

  return {
    code: source.toString(),
    map: source.generateMap({ source: id, hires: 'boundary', includeContent: true }),
  }
}

function walk(node, parent, visit) {
  const exit = visit(node, parent)
  const keys = visitorKeys[node.type] || []
  for (const key of keys) {
    const child = node[key]
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item.type === 'string') walk(item, node, visit)
      }
    } else if (child && typeof child.type === 'string') {
      walk(child, node, visit)
    }
  }
  if (exit) exit()
}

function createLineLookup(code) {
  const lineStarts = [0]
  for (let i = 0; i < code.length; i++) {
    if (code.charCodeAt(i) === 10) lineStarts.push(i + 1)
  }
  return (offset) => {
    let low = 0
    let high = lineStarts.length - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (lineStarts[mid] <= offset) low = mid
      else high = mid - 1
    }
    return low + 1
  }
}

function pickHelperName(code) {
  let name = HELPER_BASE_NAME
  for (let i = 2; code.includes(name); i++) name = HELPER_BASE_NAME + i
  return name
}
