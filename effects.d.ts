import {Action} from "redux";
import {SagaIterator, END, Channel, Task, Buffer, Predicate} from "./index";

type ActionType = string | number | symbol;

interface StringableActionCreator {
  (...args: any[]): Action;
  toString(): string;
}

type SubPattern<T> = ActionType | StringableActionCreator | Predicate<T>

export type Pattern<T> = SubPattern<T> | SubPattern<T>[];


export interface TakeEffectDescriptor<T> {
  pattern?: Pattern<T>;
  channel?: Channel<T>;
  maybe?: boolean;
}

export interface TakeEffect<T> {
  TAKE: TakeEffectDescriptor<T>;
}

export const take: {
  <T>(pattern?: Pattern<T>): TakeEffect<T>;
  <T>(channel: Channel<T>): TakeEffect<T>;

  maybe<T>(pattern?: Pattern<T>): TakeEffect<T>;
  maybe<T>(channel: Channel<T>): TakeEffect<T>;
};

/**
 * @deprecated
 */
export const takem: typeof take.maybe;


export interface PutEffectDescriptor<T> {
  action: T;
  channel: Channel<T>;
  resolve?: boolean;
}

export interface PutEffect<T> {
  PUT: PutEffectDescriptor<T>;
}

export const put: {
  <T extends Action>(action: T): PutEffect<T>;
  <T>(channel: Channel<T>, action: T | END): PutEffect<T>;

  resolve<T extends Action>(action: T): PutEffect<T>;
  resolve<T>(channel: Channel<T>, action: T | END): PutEffect<T>;

  /**
   * @deprecated
   */
  sync: typeof put.resolve;
};


export type RaceEffectDescriptor = {[key: string]: Effect};

export interface RaceEffect {
  RACE: RaceEffectDescriptor;
}

export function race(effects: {[key: string]: Effect}): RaceEffect;


export interface CallEffectDescriptor {
  context: any;
  fn: Function;
  args: any[];
}

export interface CallEffect {
  CALL: CallEffectDescriptor;
}

type Func0 = () => any;
type Func1<T1> = (arg1: T1) => any;
type Func2<T1, T2> = (arg1: T1, arg2: T2) => any;
type Func3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => any;
type Func4<T1, T2, T3, T4> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => any;
type Func5<T1, T2, T3, T4, T5> = (arg1: T1, arg2: T2, arg3: T3,
                                  arg4: T4, arg5: T5) => any;
type Func6Rest<T1, T2, T3, T4, T5, T6> = (arg1: T1, arg2: T2, arg3: T3,
                                          arg4: T4, arg5: T5, arg6: T6,
                                          ...rest: any[]) => any;

export type CallEffectArg<F> = F | [any, F] | {context: any, fn: F};


interface CallEffectFactory<R> {
  (fn: CallEffectArg<Func0>): R;
  <T1>(fn: CallEffectArg<Func1<T1>>,
       arg1: T1): R;
  <T1, T2>(fn: CallEffectArg<Func2<T1, T2>>,
           arg1: T1, arg2: T2): R;
  <T1, T2, T3>(fn: CallEffectArg<Func3<T1, T2, T3>>,
               arg1: T1, arg2: T2, arg3: T3): R;
  <T1, T2, T3, T4>(fn: CallEffectArg<Func4<T1, T2, T3, T4>>,
                   arg1: T1, arg2: T2, arg3: T3, arg4: T4): R;
  <T1, T2, T3, T4, T5>(fn: CallEffectArg<Func5<T1, T2, T3, T4, T5>>,
                       arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): R;
  <T1, T2, T3, T4, T5, T6>(fn: CallEffectArg<Func6Rest<T1, T2, T3, T4, T5, T6>>,
                           arg1: T1, arg2: T2, arg3: T3,
                           arg4: T4, arg5: T5, arg6: T6, ...rest: any[]): R;
}

export const call: CallEffectFactory<CallEffect>;

export function apply(context: any, fn: Func0): CallEffect;
export function apply<T1>(context: any, fn: Func1<T1>,
                          args: [T1]): CallEffect;
export function apply<T1, T2>(context: any, fn: Func2<T1, T2>,
                              args: [T1, T2]): CallEffect;
export function apply<T1, T2, T3>(context: any, fn: Func3<T1, T2, T3>,
                                  args: [T1, T2, T3]): CallEffect;
export function apply<T1, T2, T3, T4>(context: any, 
                                      fn: Func4<T1, T2, T3, T4>,
                                      args: [T1, T2, T3, T4]): CallEffect;
export function apply<T1, T2, T3, T4, T5>(
  context: any, fn: Func5<T1, T2, T3, T4, T5>, args: [T1, T2, T3, T4, T5],
): CallEffect;
export function apply<T1, T2, T3, T4, T5, T6, AA extends any[] & {
  0: T1; 1: T2; 2: T3; 3: T4; 4: T5; 5: T6;
}>(
  context: any, fn: Func6Rest<T1, T2, T3, T4, T5, T6>, args: AA,
): CallEffect;


export interface CpsEffect {
  CPS: CallEffectDescriptor;
}

type CpsCallback = (error: any, result: any) => void;

export function cps(fn: CallEffectArg<Func1<CpsCallback>>): CpsEffect;
export function cps<T1>(fn: CallEffectArg<Func2<T1, CpsCallback>>,
                        arg1: T1): CpsEffect;
export function cps<T1, T2>(fn: CallEffectArg<Func3<T1, T2, CpsCallback>>,
                            arg1: T1, arg2: T2): CpsEffect;
export function cps<T1, T2, T3>(
  fn: CallEffectArg<Func4<T1, T2, T3, CpsCallback>>,
  arg1: T1, arg2: T2, arg3: T3): CpsEffect;
export function cps<T1, T2, T3, T4>(
  fn: CallEffectArg<Func5<T1, T2, T3, T4, CpsCallback>>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): CpsEffect;
export function cps<T1, T2, T3, T4, T5>(
  fn: CallEffectArg<Func6Rest<T1, T2, T3, T4, T5, any>>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5,
  ...rest: any[]): CpsEffect;


export interface ForkEffectDescriptor extends CallEffectDescriptor {
  detached?: boolean;
}

export interface ForkEffect {
  FORK: ForkEffectDescriptor;
}

export const fork: CallEffectFactory<ForkEffect>;
export const spawn: CallEffectFactory<ForkEffect>;


export interface JoinEffect {
  JOIN: Task;
}

export function join(task: Task): JoinEffect;
export function join(task1: Task, task2: Task,
                     ...tasks: Task[]): JoinEffect[];


export interface CancelEffect {
  CANCEL: Task;
}

export function cancel(task: Task): CancelEffect;


export interface SelectEffectDescriptor {
  selector(state: any, ...args: any[]): any;
  args: any[];
}

export interface SelectEffect {
  SELECT: SelectEffectDescriptor;
}

export function select(): SelectEffect;
export function select<S>(selector: Func1<S>): SelectEffect;
export function select<S, T1>(selector: Func2<S, T1>,
                              arg1: T1): SelectEffect;
export function select<S, T1, T2>(selector: Func3<S, T1, T2>,
                                  arg1: T1, arg2: T2): SelectEffect;
export function select<S, T1, T2, T3>(
  selector: Func4<S, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): SelectEffect;
export function select<S, T1, T2, T3, T4>(
  selector: Func5<S, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): SelectEffect;
export function select<S, T1, T2, T3, T4, T5>(
  selector: Func6Rest<S, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5,
  ...rest: any[]): SelectEffect;


export interface ActionChannelEffectDescriptor<T> {
  pattern: Pattern<T>;
  buffer?: Buffer<T>;
}

export interface ActionChannelEffect<T> {
  ACTION_CHANNEL: ActionChannelEffectDescriptor<T>;
}

export function actionChannel<T>(pattern: Pattern<T>,
                                 buffer?: Buffer<T>): ActionChannelEffect<T>;


export interface CancelledEffect {
  CANCELLED: {};
}

export function cancelled(): CancelledEffect;

export interface FlushEffect<T> {
  FLUSH: Channel<T>;
}

export function flush<T>(channel: Channel<T>): FlushEffect<T>;


export interface RootEffect {
  root: true;
  saga(...args: any[]): SagaIterator;
  args: any[];
}


export type Effect =
  RootEffect |
  TakeEffect<any> |
  PutEffect<any> |  
  RaceEffect | CallEffect |
  CpsEffect | ForkEffect | JoinEffect | CancelEffect | SelectEffect |
  ActionChannelEffect<any> | CancelledEffect | FlushEffect<any>;


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


export function takeEvery<A>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc0<A>): ForkEffect;
export function takeEvery<A, T1>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc1<A, T1>,
  arg1: T1): ForkEffect;
export function takeEvery<A, T1, T2>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc2<A, T1, T2>,
  arg1: T1, arg2: T2): ForkEffect;
export function takeEvery<A, T1, T2, T3>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc3<A, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): ForkEffect;
export function takeEvery<A, T1, T2, T3, T4>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc4<A, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): ForkEffect;
export function takeEvery<A, T1, T2, T3, T4, T5>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc5<A, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): ForkEffect;
export function takeEvery<A, T1, T2, T3, T4, T5, T6>(
  patternOrChannel: Pattern<A> | Channel<A>,
  worker: HelperFunc6Rest<A, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]): ForkEffect;


export const takeLatest: typeof takeEvery;


export function throttle<A>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc0<A>): ForkEffect;
export function throttle<A, T1>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc1<A, T1>,
  arg1: T1): ForkEffect;
export function throttle<A, T1, T2>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc2<A, T1, T2>,
  arg1: T1, arg2: T2): ForkEffect;
export function throttle<A, T1, T2, T3>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc3<A, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): ForkEffect;
export function throttle<A, T1, T2, T3, T4>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc4<A, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): ForkEffect;
export function throttle<A, T1, T2, T3, T4, T5>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc5<A, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): ForkEffect;
export function throttle<A, T1, T2, T3, T4, T5, T6>(
  ms: number, pattern: Pattern<A>,
  worker: HelperFunc6Rest<A, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]): ForkEffect;
