import {Action, Middleware} from "redux";
import {Effect, ForkEffect} from "./effects";

export {Effect};

/**
 * Annotate return type of generators with `SagaIterator` to get strict
 * type-checking of yielded effects.
 */
export type SagaIterator = IterableIterator<Effect>;

type Saga0 = () => Iterator<any>;
type Saga1<T1> = (arg1: T1) => Iterator<any>;
type Saga2<T1, T2> = (arg1: T1, arg2: T2) => Iterator<any>;
type Saga3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => Iterator<any>;
type Saga4<T1, T2, T3, T4> =
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => Iterator<any>;
type Saga5<T1, T2, T3, T4, T5> =
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5) => Iterator<any>;
type Saga6Rest<T1, T2, T3, T4, T5, T6> =
  (arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
   ...rest: any[]) => Iterator<any>;


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


export interface EffectMiddleware {
  (next: (effect: any) => void): (effect: any) => void;
}


export interface SagaMiddleware<C = {}> extends Middleware {
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

  setContext(props: Partial<C>): void;
}

export type Logger = (level: string, ...args: any[]) => void;

export type Emit<T> = (input: T) => void;

export interface SagaMiddlewareOptions<C extends object = {}> {
  context?: C;
  sagaMonitor?: Monitor;
  logger?: Logger;
  onError?(error: Error): void;
  effectMiddlewares?: EffectMiddleware[];
  emitter?(emit: Emit<Action>): Emit<any>;
}

export default function sagaMiddlewareFactory<C extends object>(
  options?: SagaMiddlewareOptions<C>,
): SagaMiddleware<C>;

export interface RunSagaOptions<A, S> {
  channel?: PredicateTakeableChannel<A>;
  dispatch?(input: A): any;
  getState?(): S;
  context?: object;
  sagaMonitor?: Monitor;
  logger?: Logger;
  effectMiddlewares?: EffectMiddleware[];
  onError?(error: Error): void;
}

export function runSaga<A, S>(
  options: RunSagaOptions<A, S>,
  saga: Saga0): Task;
export function runSaga<A, S, T1>(
  options: RunSagaOptions<A, S>,
  saga: Saga1<T1>,
  arg1: T1): Task;
export function runSaga<A, S, T1, T2>(
  options: RunSagaOptions<A, S>,
  saga: Saga2<T1, T2>,
  arg1: T1, arg2: T2): Task;
export function runSaga<A, S, T1, T2, T3>(
  options: RunSagaOptions<A, S>,
  saga: Saga3<T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): Task;
export function runSaga<A, S, T1, T2, T3, T4>(
  options: RunSagaOptions<A, S>,
  saga: Saga4<T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): Task;
export function runSaga<A, S, T1, T2, T3, T4, T5>(
  options: RunSagaOptions<A, S>,
  saga: Saga5<T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): Task;
export function runSaga<A, S, T1, T2, T3, T4, T5, T6>(
  options: RunSagaOptions<A, S>,
  saga: Saga6Rest<T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]): Task;


export const CANCEL: string;

export type END = {type: '@@redux-saga/CHANNEL_END'};
export const END: END;

export type Predicate<T> = (arg: T) => boolean;

export interface Task {
  isRunning(): boolean;
  isCancelled(): boolean;
  result<T = any>(): T | undefined;
  error(): any | undefined;
  toPromise<T = any>(): Promise<T>;
  cancel(): void;
  setContext<C extends object>(props: Partial<C>): void;
}

export interface Buffer<T> {
  isEmpty(): boolean;
  put(message: T): void;
  take(): T | undefined;
  flush(): T[];
}

export interface TakeableChannel<T> {
  take(cb: (message: T | END) => void): void;
}

export interface PuttableChannel<T> {
  put(message: T | END): void;
}

export interface FlushableChannel<T> {
  flush(cb: (items: T[] | END) => void): void;
}

export interface Channel<T> {
  take(cb: (message: T | END) => void): void;
  put(message: T | END): void;
  flush(cb: (items: T[] | END) => void): void;
  close(): void;
}

export function channel<T>(buffer?: Buffer<T>): Channel<T>;

export interface EventChannel<T> {
  take(cb: (message: T | END) => void): void;
  flush(cb: (items: T[] | END) => void): void;
  close(): void;
}

export type Unsubscribe = () => void;
export type Subscribe<T> = (cb: (input: T | END) => void) => Unsubscribe;

export function eventChannel<T>(subscribe: Subscribe<T>,
                                buffer?: Buffer<T>): EventChannel<T>;

export interface PredicateTakeableChannel<T> {
  take(cb: (message: T | END) => void, matcher?: Predicate<T>): void;
}

export interface MulticastChannel<T> {
  take(cb: (message: T | END) => void, matcher?: Predicate<T>): void;
  put(message: T | END): void;
  close(): void;
}

export function multicastChannel<T>(): MulticastChannel<T>;
export function stdChannel<T>(): MulticastChannel<T>;

export function detach(forkEffect: ForkEffect): ForkEffect;

import * as effects from './effects';
import * as utils from './utils';

export {effects, utils};

export const buffers: {
  none<T>(): Buffer<T>;
  fixed<T>(limit?: number): Buffer<T>;
  dropping<T>(limit?: number): Buffer<T>;
  sliding<T>(limit?: number): Buffer<T>;
  expanding<T>(limit?: number): Buffer<T>;
};