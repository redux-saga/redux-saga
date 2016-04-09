import test from 'tape';
import proc from '../../src/internal/proc'
import { noop, arrayOfDeffered } from '../../src/utils'
import * as io from '../../src/effects'
import { monitorActions } from '../../src/utils'

const DELAY = 50

test('processor monitoring handling', assert => {
  assert.plan(6);

  let actual = []
  const callResults = arrayOfDeffered(2)

  function monitor(event) {
    actual.push(event)
  }

  Promise.resolve(1)
    .then( () => callResults[0].resolve('call result 1') )
    .then( () => callResults[1].resolve('call result 2') )

  function api(idx) {
    return callResults[idx].promise
  }

  function* childGen() {
    yield io.call(api, 1)
    return 'childGen'
  }

  function* genFn() {
    yield io.call(api, 0)
    yield io.call(childGen)
  }

  proc(genFn(), undefined, noop, noop, monitor).done.catch(err => assert.fail(err))

  setTimeout(() => {
    const ids = [
      actual[0].effectId, // 0- trigger io.call(api, 0)
                          // 1- resolve io.call(api, 0)
      actual[2].effectId, // 2- trigger io.call(childGen)
      actual[3].effectId  // 3- trigger childGen/io.call(api, 1)
                          // 4- resolve childGen/io.call(api, 1)
                          // 5- resolve io.call(childGen)
    ]
    const expected = [
      monitorActions.effectTriggered(ids[0], 0, '', io.call(api, 0)),
      monitorActions.effectResolved(ids[0], 'call result 1'),

      monitorActions.effectTriggered(ids[1], 0, '', io.call(childGen)),
      monitorActions.effectTriggered(ids[2], ids[1], '', io.call(api, 1)),
      monitorActions.effectResolved(ids[2], 'call result 2'),
      monitorActions.effectResolved(ids[1], 'childGen')
    ]

    assert.deepEqual(actual[0], expected[0],
      'processor must notify triggered effects'
    )

    assert.deepEqual(actual[1], expected[1],
      'processor must notify resolved effects'
    )

    assert.deepEqual(actual[2], expected[2],
      'processor must notify triggered effects (child generator)'
    )

    assert.deepEqual(actual[3], expected[3],
      'processor must notify triggered child effects with parentID'
    )

    assert.deepEqual(actual[4], expected[4],
      'processor must notify child effects resolve before parent effect resolve'
    )

    assert.deepEqual(actual[5], expected[5],
      'processor must notify parent effects resolve after child effect resolve'
    )

  }, DELAY)

});
