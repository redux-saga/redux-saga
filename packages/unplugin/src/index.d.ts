import type { UnpluginInstance } from 'unplugin'
import type { Options } from './options.js'

export type { FilterPattern, Options } from './options.js'

export interface TransformResult {
  code: string
  map: import('magic-string').SourceMap
}

export function transform(
  code: string,
  id: string,
  options?: {
    cwd?: string
    useAbsolutePath?: boolean
    /** Called with the first parse error when the file can't be parsed; the file is then left untouched. */
    onParseError?: (error: { message: string }) => void
  },
): TransformResult | null

export const unplugin: UnpluginInstance<Options | undefined, false>
