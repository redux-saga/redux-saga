import type { Options } from './options.js'
import type { Plugin } from 'rolldown'

// Typed with this bundler's own plugin type, so using one adapter doesn't need the others installed.
declare const plugin: (options?: Options) => Plugin
export default plugin

export type { FilterPattern, Options } from './options.js'
