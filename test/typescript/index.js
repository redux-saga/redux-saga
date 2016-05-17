import test from 'tape'
import * as tt from 'typescript-definition-tester';

test('TypeScript files compile against definitions', assert => {
  tt.compileDirectory(
    __dirname,
    fileName => fileName.match(/\.ts$/),
    {
      noEmitOnError: true,
      noImplicitAny: true,
      target: 2 /* ES6 */
    },
    () => assert.end()
  )
})
