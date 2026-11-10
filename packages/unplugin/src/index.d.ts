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
  options?: {
    cwd?: string
    useAbsolutePath?: boolean
    /** Called with the first parse error when the file can't be parsed; the file is then left untouched. */
    onParseError?: (error: { message: string }) => void
  },
): TransformResult | null

export const unplugin: UnpluginInstance<Options | undefined, false>
