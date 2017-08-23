import test from 'tape'
import { checkDirectory } from 'typings-tester'

test('TypeScript files compile against definitions', assert => {
  try {
    checkDirectory(__dirname)
  } catch (e) {
    assert.fail(e);
  }

  assert.end()
})
