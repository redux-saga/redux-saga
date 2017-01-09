import {Action, Middleware} from "redux";
import {Effect, Pattern} from "./effects";
import {Task, Buffer, Channel, Predicate} from "./types";

export {Effect, Pattern, Task, Buffer, Channel, Predicate};

export type SagaIterator = IterableIterator<Effect|Effect[]>;

type Saga0 = () => SagaIterator;
type Saga1<T1> = (arg1: T1) => SagaIterator;
type Saga2<T1, T2> = (arg1: T1, arg2: T2) => SagaIterator;
type Saga3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => SagaIterator;
type Saga4<T1, T2, T3, T4> = (arg1: T1, arg2: T2, arg3: T3,
                              arg4: T4) => SagaIterator;
type SagaRest = (...args: any[]) => SagaIterator;


export interface Monitor {
  effectTriggered(desc: {
    effectId: number;
    parentEffectId: number;
    label: string;
    root?: boolean;
    effect: Effect;
  }): void;

  effectResolved(effectId: number, res: any): void;
  effectRejected(effectId: number, err: any): void;
  effectCancelled(effectId: number): void;
  actionDispatched<A extends Action>(action: A): void;
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
  run(saga: SagaRest, ...args: any[]): Task;
}


export default function sagaMiddlewareFactory<T>(options?: {
  sagaMonitor?: Monitor;
  emitter: (emit: Emit<T>) => Emit<T>;
}): SagaMiddleware;


type Unsubscribe = () => void;
type Subscribe<T> = (cb: (input: T) => void) => Unsubscribe;

export type Emit<T> = (input: T) => void;

export interface Emitter<T> {
  emit(message: T): void;
  subscribe: Subscribe<T>;
}

export function runSaga<S, SA, DA>(iterator: SagaIterator, io: {
  subscribe: Subscribe<SA>;
  dispatch(input: DA): any;
  getState(): S;
}, monitor?: Monitor): Task;


export const CANCEL: string;

export const END: {type: string};

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

type HelperFunc0<A> = (action?: A) => any;
type HelperFunc1<A, T1> = (arg1: T1, action?: A) => any;
type HelperFunc2<A, T1, T2> = (arg1: T1, arg2: T2, action?: A) => any;
type HelperFunc3<A, T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3,
                                   action?: A) => any;
type HelperFunc4<A, T1, T2, T3, T4> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4,
                                       action?: A) => any;
type HelperFuncRest<A, T1, T2, T3, T4, T5> = (arg1: T1, arg2: T2, arg3: T3,
                                              arg4: T4, arg5: T5,
                                              ...rest: any[]) => any;

interface TakeHelper {
  <A>(pattern: Pattern<A>, worker: HelperFunc0<A>): SagaIterator;
  <A, T1>(pattern: Pattern<A>,
          worker: HelperFunc1<A, T1>, arg1: T1): SagaIterator;
  <A, T1, T2>(pattern: Pattern<A>,
              worker: HelperFunc2<A, T1, T2>,
              arg1: T1, arg2: T2): SagaIterator;
  <A, T1, T2, T3>(pattern: Pattern<A>,
                  worker: HelperFunc3<A, T1, T2, T3>,
                  arg1: T1, arg2: T2, arg3: T3): SagaIterator;
  <A, T1, T2, T3, T4>(pattern: Pattern<A>,
                      worker: HelperFunc4<A, T1, T2, T3, T4>,
                      arg1: T1, arg2: T2, arg3: T3, arg4: T4): SagaIterator;
  <A, T1, T2, T3, T4, T5>(pattern: Pattern<A>,
                          worker: HelperFuncRest<A, T1, T2, T3, T4, T5>,
                          arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5,
                          ...rest: any[]): SagaIterator;
}

interface ThrottleHelper {
  <A>(ms: number, pattern: Pattern<A>, worker: HelperFunc0<A>): SagaIterator;
  <A, T1>(ms: number,
          pattern: Pattern<A>,
          worker: HelperFunc1<A, T1>, arg1: T1): SagaIterator;
  <A, T1, T2>(ms: number,
              pattern: Pattern<A>,
              worker: HelperFunc2<A, T1, T2>,
              arg1: T1, arg2: T2): SagaIterator;
  <A, T1, T2, T3>(ms: number,
                  pattern: Pattern<A>,
                  worker: HelperFunc3<A, T1, T2, T3>,
                  arg1: T1, arg2: T2, arg3: T3): SagaIterator;
  <A, T1, T2, T3, T4>(ms: number,
                      pattern: Pattern<A>,
                      worker: HelperFunc4<A, T1, T2, T3, T4>,
                      arg1: T1, arg2: T2, arg3: T3, arg4: T4): SagaIterator;
  <A, T1, T2, T3, T4, T5>(ms: number,
                          pattern: Pattern<A>,
                          worker: HelperFuncRest<A, T1, T2, T3, T4, T5>,
                          arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5,
                          ...rest: any[]): SagaIterator;
}

export const takeEvery: TakeHelper;
export const takeLatest: TakeHelper;
export const throttle: ThrottleHelper;

export function delay(ms: number): Promise<boolean>;
export function delay<T>(ms: number, val: T): Promise<T>;


import * as effects from './effects';
import * as utils from './utils';

export {effects, utils};
