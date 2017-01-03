import {Action, Middleware} from "redux";
import {Effect, Pattern} from "./effects";
import {Task, Buffer, Channel, Predicate} from "./types";

export {Effect, Pattern, Task, Buffer, Channel, Predicate};

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

export interface SagaMiddlewareOptions {
  sagaMonitor?: Monitor;
  logger?: Logger;
  onError?(error: Error): void;
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
}): Task;


export const CANCEL: string;

export type END = {type: '@@redux-saga/CHANNEL_END'};
export const END: END;

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
