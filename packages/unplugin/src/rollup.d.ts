import type { Options } from './index.js'
import type { UnpluginInstance } from 'unplugin'

declare const plugin: UnpluginInstance<Options | undefined, false>['rollup']
export default plugin
