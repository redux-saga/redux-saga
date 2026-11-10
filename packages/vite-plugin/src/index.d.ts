import type { UnpluginInstance } from 'unplugin'

export type FilterPattern = string | RegExp | ReadonlyArray<string | RegExp>

export interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  useAbsolutePath?: boolean
  cwd?: string
  enabled?: boolean
}

export interface TransformResult {
  code: string
  map: import('magic-string').SourceMap
}

export function transform(
  code: string,
  id: string,
  options?: { cwd?: string; useAbsolutePath?: boolean },
): TransformResult | null

export const unplugin: UnpluginInstance<Options | undefined, false>
export const vite: UnpluginInstance<Options | undefined, false>['vite']
export const rollup: UnpluginInstance<Options | undefined, false>['rollup']
export const rolldown: UnpluginInstance<Options | undefined, false>['rolldown']
export const webpack: UnpluginInstance<Options | undefined, false>['webpack']
export const rspack: UnpluginInstance<Options | undefined, false>['rspack']
export const esbuild: UnpluginInstance<Options | undefined, false>['esbuild']

export default vite
