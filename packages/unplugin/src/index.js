import { createUnplugin } from 'unplugin'
import { transform } from './transform.js'

export { transform }

const SCRIPT_FILE = /\.[cm]?[jt]sx?$/
const NODE_MODULES = /[\\/]node_modules[\\/]/

function toMatcher(pattern) {
  if (pattern == null) return () => false
  const patterns = Array.isArray(pattern) ? pattern : [pattern]
  return (id) => patterns.some((p) => (typeof p === 'string' ? id.includes(p) : p.test(id)))
}

/**
 * Options:
 * - `include` / `exclude`: string (substring) or RegExp, or arrays of them, matched against
 *   the module id. By default every JS/TS file outside node_modules is considered.
 * - `useAbsolutePath`: report absolute file names instead of paths relative to `cwd`.
 * - `cwd`: base directory for relative file names. Defaults to Vite's `root`, else `process.cwd()`.
 * - `enabled`: force the plugin on or off. By default it runs in Vite's dev server and in
 *   non-production builds (Vitest included), and in other bundlers when
 *   `NODE_ENV !== 'production'`.
 */
export const unplugin = createUnplugin((options = {}) => {
  const isIncluded = options.include ? toMatcher(options.include) : () => true
  const isExcluded = toMatcher(options.exclude)
  let enabled = options.enabled ?? process.env.NODE_ENV !== 'production'
  let cwd = options.cwd

  return {
    name: 'redux-saga',
    enforce: 'pre',
    transformInclude(id) {
      if (!enabled) return false
      const file = id.split('?')[0]
      if (!SCRIPT_FILE.test(file) || NODE_MODULES.test(file)) return false
      return isIncluded(file) && !isExcluded(file)
    },
    transform(code, id) {
      return transform(code, id.split('?')[0], { cwd, useAbsolutePath: options.useAbsolutePath })
    },
    vite: {
      configResolved(config) {
        if (options.enabled === undefined) {
          enabled = config.command === 'serve' || config.mode !== 'production'
        }
        if (cwd === undefined) cwd = config.root
      },
    },
  }
})
