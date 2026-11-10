import type { Options } from './index'
import type { UnpluginInstance } from 'unplugin'

declare const plugin: UnpluginInstance<Options | undefined, false>['rspack']
export default plugin
