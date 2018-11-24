import { SagaIterator, Task } from '@redux-saga/types'

interface SagaIteratorClone extends SagaIterator {
  clone: () => SagaIteratorClone;
}

export function cloneableGenerator(
  iterator: () => SagaIterator
): () => SagaIteratorClone;
export function cloneableGenerator<T1>(
  iterator: (arg1: T1) => SagaIterator
): (arg1: T1) => SagaIteratorClone;
export function cloneableGenerator<T1, T2>(
  iterator: (arg1: T1, arg2: T2) => SagaIterator
): (arg1: T1, arg2: T2) => SagaIteratorClone;
export function cloneableGenerator<T1, T2, T3>(
  iterator: (arg1: T1, arg2: T2, arg3: T3) => SagaIterator
): (arg1: T1, arg2: T2, arg3: T3) => SagaIteratorClone;
export function cloneableGenerator<T1, T2, T3, T4>(
  iterator: (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => SagaIterator
): (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => SagaIteratorClone;
export function cloneableGenerator<T1, T2, T3, T4, T5>(
  iterator: (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => SagaIterator
): (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => SagaIteratorClone;
export function cloneableGenerator<T1, T2, T3, T4, T5, T6>(
  iterator: (arg1: T1, arg2: T2, arg3: T3,
             arg4: T4, arg5: T5, arg6: T6,
             arg7: any, ...rest: any[]) => SagaIterator
): (arg1: T1, arg2: T2, arg3: T3,
    arg4: T4, arg5: T5, arg6: T6,
    ...rest: any[]
) => SagaIteratorClone;

interface MockTask extends Task {
  setRunning(running: boolean): void;
  setResult(result: any): void;
  setError(error: any): void;
}

export function createMockTask(): MockTask;
