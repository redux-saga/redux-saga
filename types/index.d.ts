// Minimum TypeScript Version: 3.6

import { ActionMatchingPattern, Buffer } from "@redux-saga/types";
import { Action } from "redux";
import {
  TakeableChannel,
  PuttableChannel,
  END,
  Task,
  FlushableChannel,
  Channel,
} from "redux-saga";
import {
  ActionPattern,
  TakeEffect,
  Pattern,
  ChannelTakeEffect,
  ForkEffect,
  HelperWorkerParameters,
  PutEffect,
  ChannelPutEffect,
  CallEffect,
  SagaReturnType,
  CpsCallback,
  CpsEffect,
  CpsFunctionParameters,
  JoinEffect,
  CancelEffect,
  SelectEffect,
  Tail,
  ActionChannelEffect,
  RaceEffect,
  AllEffect,
  FlushEffect,
  CancelledEffect,
  SetContextEffect,
  GetContextEffect,
  Effect,
  CallEffectDescriptor,
} from "redux-saga/effects";

export type SagaGenerator<RT, E extends Effect> = Generator<E, RT>;

export function take(
  pattern?: ActionPattern,
): SagaGenerator<any, TakeEffect>;
export function take<A extends Action>(
  pattern?: ActionPattern<A>,
): SagaGenerator<A, TakeEffect>;
export function take<T>(
  channel: TakeableChannel<T>,
  multicastPattern?: Pattern<T>,
): SagaGenerator<T, ChannelTakeEffect<T>>;

export function takeMaybe(
  pattern?: ActionPattern,
): SagaGenerator<any, TakeEffect>;
export function takeMaybe<A extends Action>(
  pattern?: ActionPattern<A>,
): SagaGenerator<A, TakeEffect>;
export function takeMaybe<T>(
  channel: TakeableChannel<T>,
  multicastPattern?: Pattern<T>,
): SagaGenerator<T, ChannelTakeEffect<T>>;

export function takeEvery<P extends ActionPattern>(
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function takeEvery<
  P extends ActionPattern,
  Fn extends (...args: any[]) => any
>(
  pattern: P,
  worker: Fn,
  ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
): SagaGenerator<never, ForkEffect<never>>;
export function takeEvery<A extends Action>(
  pattern: ActionPattern<A>,
  worker: (action: A) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function takeEvery<
  A extends Action,
  Fn extends (...args: any[]) => any
>(
  pattern: ActionPattern<A>,
  worker: Fn,
  ...args: HelperWorkerParameters<A, Fn>
): SagaGenerator<never, ForkEffect<never>>;
export function takeEvery<T>(
  channel: TakeableChannel<T>,
  worker: (item: T) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function takeEvery<T, Fn extends (...args: any[]) => any>(
  channel: TakeableChannel<T>,
  worker: Fn,
  ...args: HelperWorkerParameters<T, Fn>
): SagaGenerator<never, ForkEffect<never>>;

export function takeLatest<P extends ActionPattern>(
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function takeLatest<
  P extends ActionPattern,
  Fn extends (...args: any[]) => any
>(
  pattern: P,
  worker: Fn,
  ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
): SagaGenerator<never, ForkEffect<never>>;
export function takeLatest<A extends Action>(
  pattern: ActionPattern<A>,
  worker: (action: A) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function takeLatest<
  A extends Action,
  Fn extends (...args: any[]) => any
>(
  pattern: ActionPattern<A>,
  worker: Fn,
  ...args: HelperWorkerParameters<A, Fn>
): SagaGenerator<never, ForkEffect<never>>;
export function takeLatest<T>(
  channel: TakeableChannel<T>,
  worker: (item: T) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function takeLatest<T, Fn extends (...args: any[]) => any>(
  channel: TakeableChannel<T>,
  worker: Fn,
  ...args: HelperWorkerParameters<T, Fn>
): SagaGenerator<never, ForkEffect<never>>;

export function takeLeading<P extends ActionPattern>(
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function takeLeading<
  P extends ActionPattern,
  Fn extends (...args: any[]) => any
>(
  pattern: P,
  worker: Fn,
  ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
): SagaGenerator<never, ForkEffect<never>>;
export function takeLeading<A extends Action>(
  pattern: ActionPattern<A>,
  worker: (action: A) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function takeLeading<
  A extends Action,
  Fn extends (...args: any[]) => any
>(
  pattern: ActionPattern<A>,
  worker: Fn,
  ...args: HelperWorkerParameters<A, Fn>
): SagaGenerator<never, ForkEffect<never>>;
export function takeLeading<T>(
  channel: TakeableChannel<T>,
  worker: (item: T) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function takeLeading<T, Fn extends (...args: any[]) => any>(
  channel: TakeableChannel<T>,
  worker: Fn,
  ...args: HelperWorkerParameters<T, Fn>
): SagaGenerator<never, ForkEffect<never>>;

export function put<A extends Action>(
  action: A,
): SagaGenerator<A, PutEffect<A>>;
export function put<T>(
  channel: PuttableChannel<T>,
  action: T | END,
): SagaGenerator<T, ChannelPutEffect<T>>;

export function putResolve<A extends Action>(
  action: A,
): SagaGenerator<A, PutEffect<A>>;

export function call<Fn extends (...args: any[]) => any>(
  fn: Fn,
  ...args: Parameters<Fn>
): SagaGenerator<SagaReturnType<Fn>, CallEffect<SagaReturnType<Fn>>>;
export function call<
  Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
  Name extends string
>(
  ctxAndFnName: [Ctx, Name],
  ...args: Parameters<Ctx[Name]>
): SagaGenerator<
  SagaReturnType<Ctx[Name]>,
  CallEffect<SagaReturnType<Ctx[Name]>>
>;
export function call<
  Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
  Name extends string
>(
  ctxAndFnName: { context: Ctx; fn: Name },
  ...args: Parameters<Ctx[Name]>
): SagaGenerator<
  SagaReturnType<Ctx[Name]>,
  CallEffect<SagaReturnType<Ctx[Name]>>
>;
export function call<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
  ctxAndFn: [Ctx, Fn],
  ...args: Parameters<Fn>
): SagaGenerator<SagaReturnType<Fn>, CallEffect<SagaReturnType<Fn>>>;
export function call<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
  ctxAndFn: { context: Ctx; fn: Fn },
  ...args: Parameters<Fn>
): SagaGenerator<SagaReturnType<Fn>, CallEffect<SagaReturnType<Fn>>>;

export function apply<
  Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
  Name extends string
>(
  ctx: Ctx,
  fnName: Name,
  args: Parameters<Ctx[Name]>,
): SagaGenerator<
  SagaReturnType<Ctx[Name]>,
  CallEffect<SagaReturnType<Ctx[Name]>>
>;
export function apply<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
  ctx: Ctx,
  fn: Fn,
  args: Parameters<Fn>,
): SagaGenerator<SagaReturnType<Fn>, CallEffect<SagaReturnType<Fn>>>;

export function cps<Fn extends (cb: CpsCallback<any>) => any>(
  fn: Fn,
): SagaGenerator<ReturnType<Fn>, CpsEffect<ReturnType<Fn>>>;
export function cps<Fn extends (...args: any[]) => any>(
  fn: Fn,
  ...args: CpsFunctionParameters<Fn>
): SagaGenerator<ReturnType<Fn>, CpsEffect<ReturnType<Fn>>>;
export function cps<
  Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => void },
  Name extends string
>(
  ctxAndFnName: [Ctx, Name],
  ...args: CpsFunctionParameters<Ctx[Name]>
): SagaGenerator<ReturnType<Ctx[Name]>, CpsEffect<ReturnType<Ctx[Name]>>>;
export function cps<
  Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => void },
  Name extends string
>(
  ctxAndFnName: { context: Ctx; fn: Name },
  ...args: CpsFunctionParameters<Ctx[Name]>
): SagaGenerator<ReturnType<Ctx[Name]>, CpsEffect<ReturnType<Ctx[Name]>>>;
export function cps<Ctx, Fn extends (this: Ctx, ...args: any[]) => void>(
  ctxAndFn: [Ctx, Fn],
  ...args: CpsFunctionParameters<Fn>
): SagaGenerator<ReturnType<Fn>, CpsEffect<ReturnType<Fn>>>;
export function cps<Ctx, Fn extends (this: Ctx, ...args: any[]) => void>(
  ctxAndFn: { context: Ctx; fn: Fn },
  ...args: CpsFunctionParameters<Fn>
): SagaGenerator<ReturnType<Fn>, CpsEffect<ReturnType<Fn>>>;

// FIXME This should be done upstream.
interface FixedTask<T> extends Task {
  result: <T>() => T | undefined;
  toPromise: <T>() => Promise<T>;
}
export function fork<Fn extends (...args: any[]) => any>(
  fn: Fn,
  ...args: Parameters<Fn>
): SagaGenerator<
  FixedTask<SagaReturnType<Fn>>,
  ForkEffect<SagaReturnType<Fn>>
>;
export function fork<
  Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
  Name extends string
>(
  ctxAndFnName: [Ctx, Name],
  ...args: Parameters<Ctx[Name]>
): SagaGenerator<
  FixedTask<SagaReturnType<Ctx[Name]>>,
  ForkEffect<SagaReturnType<Ctx[Name]>>
>;
export function fork<
  Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
  Name extends string
>(
  ctxAndFnName: { context: Ctx; fn: Name },
  ...args: Parameters<Ctx[Name]>
): SagaGenerator<
  FixedTask<SagaReturnType<Ctx[Name]>>,
  ForkEffect<SagaReturnType<Ctx[Name]>>
>;
export function fork<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
  ctxAndFn: [Ctx, Fn],
  ...args: Parameters<Fn>
): SagaGenerator<
  FixedTask<SagaReturnType<Fn>>,
  ForkEffect<SagaReturnType<Fn>>
>;
export function fork<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
  ctxAndFn: { context: Ctx; fn: Fn },
  ...args: Parameters<Fn>
): SagaGenerator<
  FixedTask<SagaReturnType<Fn>>,
  ForkEffect<SagaReturnType<Fn>>
>;

export function spawn<Fn extends (...args: any[]) => any>(
  fn: Fn,
  ...args: Parameters<Fn>
): SagaGenerator<
  FixedTask<SagaReturnType<Fn>>,
  ForkEffect<SagaReturnType<Fn>>
>;
export function spawn<
  Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
  Name extends string
>(
  ctxAndFnName: [Ctx, Name],
  ...args: Parameters<Ctx[Name]>
): SagaGenerator<
  FixedTask<SagaReturnType<Ctx[Name]>>,
  ForkEffect<SagaReturnType<Ctx[Name]>>
>;
export function spawn<
  Ctx extends { [P in Name]: (this: Ctx, ...args: any[]) => any },
  Name extends string
>(
  ctxAndFnName: { context: Ctx; fn: Name },
  ...args: Parameters<Ctx[Name]>
): SagaGenerator<
  FixedTask<SagaReturnType<Ctx[Name]>>,
  ForkEffect<SagaReturnType<Ctx[Name]>>
>;
export function spawn<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
  ctxAndFn: [Ctx, Fn],
  ...args: Parameters<Fn>
): SagaGenerator<
  FixedTask<SagaReturnType<Fn>>,
  ForkEffect<SagaReturnType<Fn>>
>;
export function spawn<Ctx, Fn extends (this: Ctx, ...args: any[]) => any>(
  ctxAndFn: { context: Ctx; fn: Fn },
  ...args: Parameters<Fn>
): SagaGenerator<
  FixedTask<SagaReturnType<Fn>>,
  ForkEffect<SagaReturnType<Fn>>
>;

export function join(task: Task): SagaGenerator<void, JoinEffect>;
export function join(tasks: Task[]): SagaGenerator<void, JoinEffect>;

export function cancel(task: Task): SagaGenerator<void, CancelEffect>;
export function cancel(tasks: Task[]): SagaGenerator<void, CancelEffect>;
export function cancel(): SagaGenerator<void, CancelEffect>;

export function select(): SagaGenerator<any, SelectEffect>;
export function select<Fn extends (state: any, ...args: any[]) => any>(
  selector: Fn,
  ...args: Tail<Parameters<Fn>>
): SagaGenerator<ReturnType<Fn>, SelectEffect>;

export function actionChannel(
  pattern: ActionPattern,
  buffer?: Buffer<Action>,
): SagaGenerator<Channel<ActionPattern>, ActionChannelEffect>;

export function flush<T>(
  channel: FlushableChannel<T>,
): SagaGenerator<T[], FlushEffect<T>>;

export function cancelled(): SagaGenerator<boolean, CancelledEffect>;

export function setContext<C extends object>(
  props: C,
): SagaGenerator<void, SetContextEffect<C>>;

export function getContext<T = unknown>(
  prop: string,
): SagaGenerator<T, GetContextEffect>;

export function delay<T = true>(
  ms: number,
  val?: T,
): SagaGenerator<T, CallEffect<T>>;

export function throttle<P extends ActionPattern>(
  ms: number,
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function throttle<
  P extends ActionPattern,
  Fn extends (...args: any[]) => any
>(
  ms: number,
  pattern: P,
  worker: Fn,
  ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
): SagaGenerator<never, ForkEffect<never>>;
export function throttle<A extends Action>(
  ms: number,
  pattern: ActionPattern<A>,
  worker: (action: A) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function throttle<A extends Action, Fn extends (...args: any[]) => any>(
  ms: number,
  pattern: ActionPattern<A>,
  worker: Fn,
  ...args: HelperWorkerParameters<A, Fn>
): SagaGenerator<never, ForkEffect<never>>;
export function throttle<T>(
  ms: number,
  channel: TakeableChannel<T>,
  worker: (item: T) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function throttle<T, Fn extends (...args: any[]) => any>(
  ms: number,
  channel: TakeableChannel<T>,
  worker: Fn,
  ...args: HelperWorkerParameters<T, Fn>
): SagaGenerator<never, ForkEffect<never>>;

export function debounce<P extends ActionPattern>(
  ms: number,
  pattern: P,
  worker: (action: ActionMatchingPattern<P>) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function debounce<
  P extends ActionPattern,
  Fn extends (...args: any[]) => any
>(
  ms: number,
  pattern: P,
  worker: Fn,
  ...args: HelperWorkerParameters<ActionMatchingPattern<P>, Fn>
): SagaGenerator<never, ForkEffect<never>>;
export function debounce<A extends Action>(
  ms: number,
  pattern: ActionPattern<A>,
  worker: (action: A) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function debounce<A extends Action, Fn extends (...args: any[]) => any>(
  ms: number,
  pattern: ActionPattern<A>,
  worker: Fn,
  ...args: HelperWorkerParameters<A, Fn>
): SagaGenerator<never, ForkEffect<never>>;

export function debounce<T>(
  ms: number,
  channel: TakeableChannel<T>,
  worker: (item: T) => any,
): SagaGenerator<never, ForkEffect<never>>;
export function debounce<T, Fn extends (...args: any[]) => any>(
  ms: number,
  channel: TakeableChannel<T>,
  worker: Fn,
  ...args: HelperWorkerParameters<T, Fn>
): SagaGenerator<never, ForkEffect<never>>;

export function retry<Fn extends (...args: any[]) => any>(
  maxTries: number,
  delayLength: number,
  fn: Fn,
  ...args: Parameters<Fn>
): SagaGenerator<SagaReturnType<Fn>, CallEffect<SagaReturnType<Fn>>>;

type EffectReturnType<T> = T extends CallEffect
  ? T["payload"] extends CallEffectDescriptor<infer RT>
    ? RT
    : never
  : T extends TakeEffect
  ? ActionPattern
  : unknown;

export function all<T>(
  effects: T[],
): SagaGenerator<EffectReturnType<T>[], AllEffect<T>>;
export function all<T extends { [key: string]: any }>(
  effects: T,
): SagaGenerator<
  { [K in keyof T]: EffectReturnType<T[K]> },
  AllEffect<T[keyof T]>
>;

export function race<T>(
  effects: T[],
): SagaGenerator<(EffectReturnType<T> | undefined)[], RaceEffect<T>>;
export function race<T extends { [key: string]: any }>(
  effects: T,
): SagaGenerator<
  { [K in keyof T]: EffectReturnType<T[K]> | undefined },
  RaceEffect<T[keyof T]>
>;
