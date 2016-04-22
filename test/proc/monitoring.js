import test from 'tape';
import proc from '../../src/internal/proc'
import { noop, arrayOfDeffered } from '../../src/utils'
import * as io from '../../src/effects'

test('proc monitoring', assert => {
  assert.plan(1)

  let actual = {}
  let ids = []
  const apiDefs = arrayOfDeffered(2)

  const monitor = {
    effectTriggered({effectId, parentEffectId, label, effect}) {
      ids.push(effectId)
      actual[effectId] = { parentEffectId, label, effect }
    },

    effectResolved(effectId, res) {
      actual[effectId].result = res
    },

    effectRejected(effectId, err) {
      actual[effectId].error = err
    },

    effectCancelled(effectId) {
      actual[effectId].cancelled = true
    }
  }

  Promise.resolve(1)
    .then( () => apiDefs[0].resolve('api1') )
    .then( () => apiDefs[1].resolve('api2') )

  function api(idx) {
    return apiDefs[idx].promise
  }

  function* child() {
    yield io.call(api, 1)
    throw 'child error'
  }

  function* main() {
    try {
      yield io.call(api, 0)
      yield io.race({
        action: io.take('action'),
        call: io.call(child)
      })
    } catch(e) {
      void(0)
    }
  }

  proc(main(), undefined, noop, noop, monitor).done.catch(err => assert.fail(err))

  setTimeout(() => {
    const expected = {
      [ids[0]]: { parentEffectId: 0, label: '', effect: io.call(api, 0), result: 'api1' },
      [ids[1]]: { parentEffectId: 0, label: '', effect: io.race({ action: io.take('action'), call: io.call(child) }), error: 'child error' },
      [ids[2]]: { parentEffectId: ids[1], label: 'action', effect: io.take('action'), cancelled: true },
      [ids[3]]: { parentEffectId: ids[1], label: 'call', effect: io.call(child), error: 'child error' },
      [ids[4]]: { parentEffectId: ids[3], label: '', effect: io.call(api, 1), result: 'api2' }
    }

    assert.deepEqual(actual, expected, 'proc must notify monitor')
  })

});
