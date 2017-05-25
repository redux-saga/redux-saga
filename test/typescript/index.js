import test from 'tape'
import { checkDirectory } from 'typings-tester'

test('TypeScript files compile against definitions', assert => {
  assert.doesNotThrow(() => checkDirectory(__dirname))
  assert.end()
})
