import { relative } from 'node:path'
import MagicString from 'magic-string'
import { parseSync, visitorKeys } from 'oxc-parser'

const SYMBOL_NAME = '@@redux-saga/LOCATION'
const HELPER_BASE_NAME = '_extendSagaSourceLocation'

const TS_EXPRESSION_WRAPPERS = new Set([
  'TSAsExpression',
  'TSSatisfiesExpression',
  'TSNonNullExpression',
  'TSTypeAssertion',
])

function unwrapTypeAssertions(node) {
  while (TS_EXPRESSION_WRAPPERS.has(node.type)) node = node.expression
  return node
}

/**
 * Whether a yielded expression is worth tagging: something that builds a fresh value per yield.
 * Bare identifiers and member accesses are skipped, as they usually point at a shared object.
 */
function isEffectLike(node) {
  switch (node.type) {
    case 'CallExpression':
      return true
    // `foo?.()` and `a?.b()` are a ChainExpression around the call. Like a plain call they
    // produce a fresh value, and a short-circuited `undefined` is skipped by the helper.
    case 'ChainExpression':
      return unwrapTypeAssertions(node.expression).type === 'CallExpression'
    // Kept as in babel-plugin-redux-saga: any `a || b` / `a && b` is tagged.
    case 'LogicalExpression':
      return true
    // `cond ? call(a) : call(b)`: tagged when either branch could be an effect.
    case 'ConditionalExpression':
      return isEffectLike(unwrapTypeAssertions(node.consequent)) || isEffectLike(unwrapTypeAssertions(node.alternate))
    default:
      return false
  }
}

// Assignment operators that give an anonymous function the target's name.
const NAMING_ASSIGNMENTS = new Set(['=', '&&=', '||=', '??='])

/**
 * The name JavaScript would infer for an anonymous function expression from where it sits
 * (`const saga = function* () {}` is named `saga`). Wrapping the expression in a call stops
 * that inference, so the helper puts the name back.
 */
function inferredName(node, ancestors) {
  if (node.id) return null
  // Type assertions vanish when types are stripped, so `const saga = function* () {} as Saga`
  // is named `saga` too.
  let depth = ancestors.length - 1
  while (depth >= 0 && TS_EXPRESSION_WRAPPERS.has(ancestors[depth].type)) node = ancestors[depth--]
  const parent = ancestors[depth]
  if (!parent) return null
  switch (parent.type) {
    case 'VariableDeclarator':
      return parent.init === node && parent.id.type === 'Identifier' ? parent.id.name : null
    case 'AssignmentExpression':
      return parent.right === node && parent.left.type === 'Identifier' && NAMING_ASSIGNMENTS.has(parent.operator)
        ? parent.left.name
        : null
    case 'AssignmentPattern':
      return parent.right === node && parent.left.type === 'Identifier' ? parent.left.name : null
    case 'Property':
    case 'PropertyDefinition':
    case 'AccessorProperty':
      return parent.value === node ? keyName(parent.key, parent.computed) : null
    default:
      return null
  }
}

// A computed key only has a known name when it is a literal (`{ ['saga']: function* () {} }`).
function keyName(key, computed) {
  if (!computed && key.type === 'Identifier') return key.name
  if (!computed && key.type === 'PrivateIdentifier') return '#' + key.name
  if (key.type === 'Literal' && (typeof key.value === 'string' || typeof key.value === 'number'))
    return String(key.value)
  return null
}

/**
 * Parses with the most permissive settings the file allows: `.js` files may contain JSX (common
 * in webpack setups), and files that aren't explicitly ES modules may be CommonJS (top-level
 * `return`). Returns the first set of errors when nothing works.
 */
function parse(id, code) {
  const extension = id.slice(id.lastIndexOf('.') + 1)
  const lang = extension === 'js' || extension === 'mjs' || extension === 'cjs' ? 'jsx' : undefined
  const sourceTypes =
    extension === 'cjs' || extension === 'cts'
      ? ['commonjs']
      : extension === 'mjs' || extension === 'mts'
      ? ['module']
      : ['module', 'commonjs']
  let firstErrors
  for (const sourceType of sourceTypes) {
    const result = parseSync(id, code, { lang, sourceType, preserveParens: false })
    if (result.errors.length === 0) return { program: result.program, comments: result.comments }
    firstErrors ??= result.errors
  }
  return { errors: firstErrors }
}

/**
 * Offset of a `//# sourceMappingURL=...` (or legacy `//@`) comment when it is the last thing in
 * the file. Taken from the parser's comments, so text that merely looks like one inside a string
 * or template literal doesn't count.
 */
function trailingSourceMapComment(code, comments) {
  const last = comments[comments.length - 1]
  const isTrailing =
    last && last.type === 'Line' && /^[#@]\s*sourceMappingURL=/.test(last.value) && code.slice(last.end).trim() === ''
  return isTrailing ? last.start : null
}

const TYPESCRIPT_FILE = /\.[cm]?tsx?$/

// Cheap pre-check so files without generators are never parsed. A comment may sit between
// `function` and `*`, so `function` followed by any comment is let through for the parser to decide.
export const MAYBE_SAGA = /\byield\b|function\s*(?:\*|\/[/*])/

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
 * Returns `null` when there is nothing to change or the file doesn't parse. In the latter
 * case `options.onParseError` is called with the first error; the bundler's own parser will
 * report real syntax errors.
 */
export function transform(code, id, options = {}) {
  if (!mightContainSagas(code)) return null

  const result = parse(id, code)
  if (result.errors) {
    options.onParseError?.(result.errors[0])
    return null
  }

  const fileName = JSON.stringify(getFileName(id, options))
  const lineOf = createLineLookup(code)
  const source = new MagicString(code)
  let helperName
  const symbol = JSON.stringify(SYMBOL_NAME)

  const location = (node, snippet) =>
    `{ fileName: ${fileName}, lineNumber: ${lineOf(node.start)}, code: ${
      snippet == null ? 'null' : JSON.stringify(snippet.replace(/\r/g, ''))
    } }`

  // Openings are inserted on enter and closings on exit, so when edits share an offset
  // (e.g. a wrapped function expression ending where a wrapped yield argument ends)
  // the inner wrapper is closed before the outer one.
  const visit = (node, parent, ancestors) => {
    switch (node.type) {
      case 'FunctionDeclaration': {
        // `export default function* () {}` has no binding to attach to.
        if (!node.generator || !node.id || !node.body) return
        const statement =
          parent && (parent.type === 'ExportNamedDeclaration' || parent.type === 'ExportDefaultDeclaration')
            ? parent
            : node
        // When a name is declared twice in one scope, the binding is the last declaration, so
        // only that one is annotated (the first annotation would otherwise win with its line).
        if (isRedeclaredLater(statement, statement === node ? parent : ancestors[ancestors.length - 2], node.id.name))
          return
        // Through the helper rather than a bare defineProperty: the binding may have been
        // reassigned to a non-object.
        source.appendLeft(statement.end, `;${helperName}(${node.id.name}, ${location(node)});`)
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
        // A call binds at least as tight as anything the function expression could be an operand
        // of, except at the head of a `new` callee: `new function* () {}.bind(null)` would become
        // `new helper(...).bind(null)`, constructing the helper and hiding the TypeError that
        // constructing a generator throws. Parentheses keep the original callee.
        const parens = headsNewCallee(node, ancestors)
        const snippet = code.slice(node.start, node.end)
        const name = inferredName(node, ancestors)
        source.appendRight(node.start, `${parens ? '(' : ''}${helperName}(`)
        return () =>
          source.appendLeft(
            node.end,
            `, ${location(node, snippet)}${name == null ? '' : `, ${JSON.stringify(name)}`})${parens ? ')' : ''}`,
          )
      }
      case 'YieldExpression': {
        if (node.delegate || !node.argument) return
        // Look through TS-only wrappers (`call(fn) as Effect`, `call(fn)!`, `<T>call(fn)`) and wrap
        // the expression inside. That matches what a tsc -> Babel pipeline saw, since the types
        // were already gone by then, and keeps the type assertion applying to the result.
        const argument = unwrapTypeAssertions(node.argument)
        if (!isEffectLike(argument)) return
        // A call argument accepts any AssignmentExpression, the same grammar as a
        // yield argument, so no parentheses are needed around the original text.
        const snippet = code.slice(argument.start, argument.end)
        source.appendRight(argument.start, `${helperName}(`)
        return () => source.appendLeft(argument.end, `, ${location(node, snippet)})`)
      }
    }
  }

  try {
    helperName = pickHelperName(code, result.program)
    walk(result.program, [], visit)
  } catch (error) {
    // Generated code can nest expressions deeper than the call stack allows; skip such a file
    // rather than fail the build.
    if (!(error instanceof RangeError)) throw error
    options.onParseError?.({ message: 'its syntax tree is nested too deeply' })
    return null
  }

  if (!source.hasChanged()) return null

  // Function declarations are hoisted, so the helper can go at the very end. That keeps it
  // clear of hashbangs and directive prologues and leaves every source line in place.
  // A trailing `//# sourceMappingURL=` comment stays last, as tools only look for it there.
  // The helper never throws: primitives, frozen or sealed objects and already-tagged values
  // are returned untouched, and the try/catch covers Proxies whose traps refuse the property.
  // It is typed, with annotations in TypeScript files and JSDoc in JavaScript ones (for
  // `checkJs`), so the output still passes a type-checking loader and yielded values keep
  // their type.
  const isTypeScript = TYPESCRIPT_FILE.test(id)
  const signature = isTypeScript ? '<T>(value: T, location: any, name?: string): T' : '(value, location, name)'
  const target = isTypeScript ? '(value as any)' : '/** @type {any} */ (value)'
  const jsDoc = isTypeScript
    ? ''
    : '/**\n * @template T\n * @param {T} value\n * @param {any} location\n * @param {string} [name]\n * @returns {T}\n */\n'
  source.appendLeft(
    trailingSourceMapComment(code, result.comments) ?? code.length,
    `\n${jsDoc}function ${helperName}${signature} { try { ` +
      `if (value !== null && (typeof value === 'object' || typeof value === 'function') && ` +
      `Object.isExtensible(value) && !Object.prototype.hasOwnProperty.call(value, ${symbol})) { ` +
      `Object.defineProperty(value, ${symbol}, { value: location }); ` +
      `if (name && ${target}.name === '') Object.defineProperty(value, 'name', { value: name, configurable: true }); ` +
      `} } catch (e) {} return value; }\n`,
  )

  return {
    code: source.toString(),
    map: source.generateMap({ source: id, hires: 'boundary', includeContent: true }),
  }
}

function headsNewCallee(node, ancestors) {
  let child = node
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const parent = ancestors[i]
    if (parent.type === 'NewExpression') return parent.callee === child
    const continuesCallee =
      (parent.type === 'MemberExpression' && parent.object === child) ||
      (parent.type === 'TaggedTemplateExpression' && parent.tag === child)
    if (!continuesCallee) return false
    child = parent
  }
  return false
}

function isRedeclaredLater(statement, container, name) {
  const statements = container && (Array.isArray(container.body) ? container.body : container.consequent)
  if (!Array.isArray(statements)) return false
  for (let i = statements.indexOf(statement) + 1; i > 0 && i < statements.length; i++) {
    let later = statements[i]
    if (later.type === 'ExportNamedDeclaration' || later.type === 'ExportDefaultDeclaration') later = later.declaration
    if (later && later.type === 'FunctionDeclaration' && later.body && later.id && later.id.name === name) return true
  }
  return false
}

// `visit(node, parent, ancestors)`; `ancestors` ends with `parent` and is only valid during the call.
function walk(node, ancestors, visit) {
  const exit = visit(node, ancestors[ancestors.length - 1], ancestors)
  const keys = visitorKeys[node.type] || []
  ancestors.push(node)
  for (const key of keys) {
    const child = node[key]
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item.type === 'string') walk(item, ancestors, visit)
      }
    } else if (child && typeof child.type === 'string') {
      walk(child, ancestors, visit)
    }
  }
  ancestors.pop()
  if (exit) exit()
}

function createLineLookup(code) {
  const lineStarts = [0]
  // JavaScript's line terminators are LF, CR, U+2028 and U+2029, and CRLF counts as one break.
  for (let i = 0; i < code.length; i++) {
    const char = code.charCodeAt(i)
    if (char === 13 && code.charCodeAt(i + 1) === 10) continue
    if (char === 10 || char === 13 || char === 0x2028 || char === 0x2029) lineStarts.push(i + 1)
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

function pickHelperName(code, program) {
  // Identifiers may be spelled with unicode escapes (`_extendSagaSourceLocatio\u006e`), which a
  // text search misses; the parsed names are decoded.
  const escapedNames = code.includes('\\u') ? identifierNames(program) : null
  let name = HELPER_BASE_NAME
  for (let i = 2; code.includes(name) || escapedNames?.has(name); i++) name = HELPER_BASE_NAME + i
  return name
}

function identifierNames(program) {
  const names = new Set()
  walk(program, [], (node) => {
    if (node.type === 'Identifier') names.add(node.name)
  })
  return names
}
