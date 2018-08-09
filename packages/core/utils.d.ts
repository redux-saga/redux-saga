import { Pattern, ActionPattern, Effect } from "./effects";
import {Task, Channel, Buffer, SagaIterator} from "./index";

export const TASK: string | symbol;
export const SAGA_ACTION: string | symbol;

export function noop(): void;

export type GuardPredicate<G extends T, T = any> = (arg: T) => arg is G;

export const is: {
  undef: GuardPredicate<undefined>;
  notUndef: GuardPredicate<any>;
  func: GuardPredicate<Function>;
  number: GuardPredicate<number>;
  string: GuardPredicate<string>;
  array: GuardPredicate<Array<any>>;
  object: GuardPredicate<object>;
  promise: GuardPredicate<Promise<any>>;
  iterator: GuardPredicate<Iterator<any>>;
  iterable: GuardPredicate<Iterable<any>>;
  task: GuardPredicate<Task>;
  observable: GuardPredicate<{subscribe: Function}>;
  buffer: GuardPredicate<Buffer<any>>;
  pattern: GuardPredicate<Pattern<any> | ActionPattern>;
  channel: GuardPredicate<Channel<any>>;
  helper: GuardPredicate<SagaIterator>;
  stringableFunc: GuardPredicate<Function>;
  effect: GuardPredicate<Effect>
};

interface Deferred<R> {
  resolve(result: R): void;
  reject(error: any): void;
  promise: Promise<R>;
}

export function deferred<T, R>(props?: T): T & Deferred<R>;

export function arrayOfDeferred<T>(length: number): Deferred<T>[];

interface MockTask extends Task {
  setRunning(running: boolean): void;
  setResult(result: any): void;
  setError(error: any): void;
}

export function createMockTask(): MockTask;

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
