import { checkDirectory } from 'typings-tester'

test('TypeScript files compile against definitions', () => {
  checkDirectory(__dirname)
})
