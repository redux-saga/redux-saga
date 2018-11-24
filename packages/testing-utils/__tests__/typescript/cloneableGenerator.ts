import { SagaIterator } from 'redux-saga';
import { put } from 'redux-saga/effects';
import { cloneableGenerator } from '@redux-saga/testing-utils';

function testCloneableGenerator() {
  function* testSaga(): SagaIterator {
    yield put({type: 'my-action'});
  }

  const cloneableGen = cloneableGenerator(testSaga)();
  const value = cloneableGen.next().value;

  const clone = cloneableGen.clone();
  const cloneVal = clone.next().value;
}

function testCloneableGenerator1() {
  function* testSaga(n1: number): SagaIterator {
    yield put({type: 'my-action'});
  }

  // typings:expect-error
  cloneableGenerator(testSaga)();

  // typings:expect-error
  cloneableGenerator(testSaga)('foo');

  cloneableGenerator(testSaga)(1);
}

function testCloneableGenerator2() {
  function* testSaga(n1: number, n2: number): SagaIterator {
    yield put({type: 'my-action'});
  }
  cloneableGenerator(testSaga)(1, 2);
}

function testCloneableGenerator3() {
  function* testSaga(n1: number, n2: number, n3: number): SagaIterator {
    yield put({type: 'my-action'});
  }

  // typings:expect-error
  cloneableGenerator(testSaga)(1, 2);

  cloneableGenerator(testSaga)(1, 2, 3);
}

function testCloneableGenerator4() {
  function* testSaga(
    n1: number,
    n2: number,
    n3: number,
    n4: number,
  ): SagaIterator {
    yield put({type: 'my-action'});
  }
  cloneableGenerator(testSaga)(1, 2, 3, 4);
}

function testCloneableGenerator5() {
  function* testSaga(
    n1: number,
    n2: number,
    n3: number,
    n4: number,
    n5: number,
  ): SagaIterator {
    yield put({type: 'my-action'});
  }
  cloneableGenerator(testSaga)(1, 2, 3, 4, 5);
}

function testCloneableGenerator6() {
  function* testSaga(
    n1: number,
    n2: number,
    n3: number,
    n4: number,
    n5: number,
    n6: number,
  ): SagaIterator {
    yield put({type: 'my-action'});
  }
  cloneableGenerator(testSaga)(1, 2, 3, 4, 5, 6);
}

function testCloneableGenerator6Rest() {
  function* testSaga(
    n1: number,
    n2: number,
    n3: number,
    n4: number,
    n5: number,
    n6: number,
    n7: number,
  ): SagaIterator {
    yield put({type: 'my-action'});
  }
  cloneableGenerator(testSaga)(1, 2, 3, 4, 5, 6, 7);
}
