import type { Options } from './options.js'
import type { RspackPluginInstance } from '@rspack/core'

// Typed with this bundler's own plugin type, so using one adapter doesn't need the others installed.
declare const plugin: (options?: Options) => RspackPluginInstance
export default plugin

export type { FilterPattern, Options } from './options.js'
