import {Action, Middleware} from "redux";
import {Effect, Pattern} from "./effects";

export {Effect, Pattern};

export type SagaIterator = IterableIterator<Effect|Effect[]>;

type Saga0 = () => SagaIterator;
type Saga1<T1> = (arg1: T1) => SagaIterator;
type Saga2<T1, T2> = (arg1: T1, arg2: T2) => SagaIterator;
type Saga3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => SagaIterator;
type Saga4<T1, T2, T3, T4> =
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => SagaIterator;
type Saga5<T1, T2, T3, T4, T5> =
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => SagaIterator;
type Saga6Rest<T1, T2, T3, T4, T5, T6> =
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
   ...rest: any[]) => SagaIterator;


export interface Monitor {
  effectTriggered?(desc: {
    effectId: number;
    parentEffectId: number;
    label?: string;
    root?: boolean;
    effect: Effect;
  }): void;

  effectResolved?(effectId: number, res: any): void;
  effectRejected?(effectId: number, err: any): void;
  effectCancelled?(effectId: number): void;
  actionDispatched?<A extends Action>(action: A): void;
}


export interface SagaMiddleware extends Middleware {
  run(saga: Saga0): Task;
  run<T1>(saga: Saga1<T1>,
          arg1: T1): Task;
  run<T1, T2>(saga: Saga2<T1, T2>,
              arg1: T1, arg2: T2): Task;
  run<T1, T2, T3>(saga: Saga3<T1, T2, T3>,
                  arg1: T1, arg2: T2, arg3: T3): Task;
  run<T1, T2, T3, T4>(saga: Saga4<T1, T2, T3, T4>,
                      arg1: T1, arg2: T2, arg3: T3, arg4: T4): Task;
  run<T1, T2, T3, T4, T5>(saga: Saga5<T1, T2, T3, T4, T5>,
                          arg1: T1, arg2: T2, arg3: T3,
                          arg4: T4, arg5: T5): Task;
  run<T1, T2, T3, T4, T5, T6>(saga: Saga6Rest<T1, T2, T3, T4, T5, T6>,
                              arg1: T1, arg2: T2, arg3: T3,
                              arg4: T4, arg5: T5, arg6: T6,
                              ...rest: any[]): Task;
}

export type Logger = (level: string, ...args: any[]) => void;

export type Emit<T> = (input: T) => void;

export interface SagaMiddlewareOptions {
  sagaMonitor?: Monitor;
  logger?: Logger;
  onError?(error: Error): void;
  emitter?(emit: Emit<Action>): Emit<any>;
}

export default function sagaMiddlewareFactory(options?: SagaMiddlewareOptions):
  SagaMiddleware;


type Unsubscribe = () => void;
type Subscribe<T> = (cb: (input: T | END) => void) => Unsubscribe;

export function runSaga<A, S>(iterator: SagaIterator, options: {
  subscribe?: Subscribe<A>;
  dispatch?(input: A): any;
  getState?(): S;
  sagaMonitor?: Monitor;
  logger?: Logger;
  onError?(error: Error): void;
}): Task;


export const CANCEL: string;

export type END = {type: '@@redux-saga/CHANNEL_END'};
export const END: END;

export type Predicate<T> = (arg: T) => boolean;

export interface Task {
  isRunning(): boolean;
  isCancelled(): boolean;
  result(): any | undefined;
  result<T>(): T | undefined;
  error(): any | undefined;
  done: Promise<any>;
  cancel(): void;
}

export interface Buffer<T> {
  isEmpty(): boolean;
  put(message: T): void;
  take(): T | undefined;
  flush(): void;
}

export interface Channel<T> {
  take(cb: (message: T | END) => void): void;
  put(message: T | END): void;
  flush(): void;
  close(): void;
}

export function channel<T>(buffer?: Buffer<T>): Channel<T>;

export function eventChannel<T>(subscribe: Subscribe<T>, buffer?: Buffer<T>,
                                matcher?: Predicate<T>): Channel<T>;

export const buffers: {
  none<T>(): Buffer<T>;
  fixed<T>(limit?: number): Buffer<T>;
  dropping<T>(limit?: number): Buffer<T>;
  sliding<T>(limit?: number): Buffer<T>;
  expanding<T>(limit?: number): Buffer<T>;
};

export function delay(ms: number): Promise<true>;
export function delay<T>(ms: number, val: T): Promise<T>;


import * as effects from './effects';
import * as utils from './utils';

export {effects, utils};


type HelperFunc0<A> = (action: A) => any;
type HelperFunc1<A, T1> = (arg1: T1, action: A) => any;
type HelperFunc2<A, T1, T2> = (arg1: T1, arg2: T2, action: A) => any;
type HelperFunc3<A, T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3,
                                   action: A) => any;
type HelperFunc4<A, T1, T2, T3, T4> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4,
                                       action: A) => any;
type HelperFunc5<A, T1, T2, T3, T4, T5> = (arg1: T1, arg2: T2, arg3: T3,
                                           arg4: T4, arg5: T5,
                                           action: A) => any;
type HelperFunc6Rest<A, T1, T2, T3, T4, T5, T6> = (
  arg1: T1, arg2: T2, arg3: T3,
  arg4: T4, arg5: T5, arg6: T6,
  arg7: any, ...rest: any[]) => any;


/**
 * @deprecated
 */
export function takeEvery<A>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc0<A>): SagaIterator;
export function takeEvery<A, T1>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc1<A, T1>,
  arg1: T1): SagaIterator;
export function takeEvery<A, T1, T2>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc2<A, T1, T2>,
  arg1: T1, arg2: T2): SagaIterator;
export function takeEvery<A, T1, T2, T3>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc3<A, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): SagaIterator;
export function takeEvery<A, T1, T2, T3, T4>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc4<A, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): SagaIterator;
export function takeEvery<A, T1, T2, T3, T4, T5>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc5<A, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): SagaIterator;
export function takeEvery<A, T1, T2, T3, T4, T5, T6>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc6Rest<A, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]): SagaIterator;


/**
 * @deprecated
 */
export const takeLatest: typeof takeEvery;

/**
 * @deprecated
 */
export function throttle<A>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc0<A>): SagaIterator;
export function throttle<A, T1>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc1<A, T1>,
  arg1: T1): SagaIterator;
export function throttle<A, T1, T2>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc2<A, T1, T2>,
  arg1: T1, arg2: T2): SagaIterator;
export function throttle<A, T1, T2, T3>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc3<A, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): SagaIterator;
export function throttle<A, T1, T2, T3, T4>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc4<A, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): SagaIterator;
export function throttle<A, T1, T2, T3, T4, T5>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc5<A, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): SagaIterator;
export function throttle<A, T1, T2, T3, T4, T5, T6>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc6Rest<A, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]): SagaIterator;
