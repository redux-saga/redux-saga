import type { Options } from './options.js'
import type { WebpackPluginInstance } from 'webpack'

// Typed with this bundler's own plugin type, so using one adapter doesn't need the others installed.
declare const plugin: (options?: Options) => WebpackPluginInstance
export default plugin

export type { FilterPattern, Options } from './options.js'
