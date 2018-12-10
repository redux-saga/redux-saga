import { SagaIterator, Task, Saga } from '@redux-saga/types'

/**
 * Takes a generator function (function*) and returns a generator function.
 * All generators instanciated from this function will be cloneable.
 * For testing purpose only.
 *
 * #### Example
 *
 * This is useful when you want to test a different branch of a saga without
 * having to replay the actions that lead to it.
 *
 *    import { cloneableGenerator } from '@redux-saga/testing-utils';
 *
 *    function* oddOrEven() {
 *      // some stuff are done here
 *      yield 1;
 *      yield 2;
 *      yield 3;
 *
 *      const userInput = yield 'enter a number';
 *      if (userInput % 2 === 0) {
 *        yield 'even';
 *      } else {
 *        yield 'odd'
 *      }
 *    }
 *
 *    test('my oddOrEven saga', assert => {
 *      const data = {};
 *      data.gen = cloneableGenerator(oddOrEven)();
 *
 *      assert.equal(
 *        data.gen.next().value,
 *        1,
 *        'it should yield 1'
 *      );
 *
 *      assert.equal(
 *        data.gen.next().value,
 *        2,
 *        'it should yield 2'
 *      );
 *
 *      assert.equal(
 *        data.gen.next().value,
 *        3,
 *        'it should yield 3'
 *      );
 *
 *      assert.equal(
 *        data.gen.next().value,
 *        'enter a number',
 *        'it should ask for a number'
 *      );
 *
 *      assert.test('even number is given', a => {
 *        // we make a clone of the generator before giving the number;
 *        data.clone = data.gen.clone();
 *
 *        a.equal(
 *          data.gen.next(2).value,
 *          'even',
 *          'it should yield "even"'
 *        );
 *
 *        a.equal(
 *          data.gen.next().done,
 *          true,
 *          'it should be done'
 *        );
 *
 *        a.end();
 *      });
 *
 *      assert.test('odd number is given', a => {
 *
 *        a.equal(
 *          data.clone.next(1).value,
 *          'odd',
 *          'it should yield "odd"'
 *        );
 *
 *        a.equal(
 *          data.clone.next().done,
 *          true,
 *          'it should be done'
 *        );
 *
 *        a.end();
 *      });
 *
 *      assert.end();
 *    });
 */
export function cloneableGenerator<S extends Saga>(saga: S): (...args: Parameters<S>) => SagaIteratorClone

export interface SagaIteratorClone extends SagaIterator {
  clone: () => SagaIteratorClone
}

/**
 * Returns an object that mocks a task.
 * For testing purposes only.
 */
export function createMockTask(): MockTask

export interface MockTask extends Task {
  setRunning(running: boolean): void
  setResult(result: any): void
  setError(error: any): void
}
