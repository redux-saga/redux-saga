import test from 'tape';
import proc from '../../src/proc'

test('processor native promise handling', assert => {
  assert.plan(1)

  let actual = []

  function* genFn() {
    try {
      actual.push( yield Promise.resolve(1) )
      actual.push( yield Promise.reject('error') )
    } catch (e) {
      actual.push('caught ' + e)
    }
  }

  const endP = proc(genFn()).done
  endP.catch(err => assert.fail(err))

  endP.then(() => {
    assert.deepEqual(actual, [1,'caught error'],
      'processor should handle promise resolveed/rejecetd values'
    )
  })

})
