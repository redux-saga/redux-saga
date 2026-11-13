export type FilterPattern = string | RegExp | ReadonlyArray<string | RegExp>

export interface Options {
  include?: FilterPattern
  exclude?: FilterPattern
  useAbsolutePath?: boolean
  cwd?: string
  enabled?: boolean
}
