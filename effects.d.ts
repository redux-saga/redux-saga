import {Action} from "redux";
import {Channel, Task, Buffer, Predicate} from "./types";

type Pattern<T> = string | string[] | Predicate<T>;


interface TakeEffectDescriptor<T> {
  pattern: Pattern<T>;
  channel: Channel<T>;
  maybe?: boolean;
}

interface TakeEffect<T> {
  TAKE: TakeEffectDescriptor<T>;
}

export function take<T>(pattern: Pattern<T>): TakeEffect<T>;
export function take<T>(channel: Channel<T>, 
                        pattern?: Pattern<T>): TakeEffect<T>;

export function takem<T>(pattern: Pattern<T>): TakeEffect<T>;
export function takem<T>(channel: Channel<T>, 
                         pattern?: Pattern<T>): TakeEffect<T>;


interface PutEffectDescriptor<T> {
  action: T;
  channel: Channel<T>;
}

interface PutEffect<T> {
  PUT: PutEffectDescriptor<T>;
}

export function put<T extends Action>(action: T): PutEffect<T>;
export function put<T>(channel: Channel<T>, action: T): PutEffect<T>;


type RaceEffectDescriptor = {[key: string]: Effect};

interface RaceEffect {
  RACE: RaceEffectDescriptor;
}

export function race(effects: {[key: string]: Effect}): RaceEffect;


interface CallEffectDescriptor {
  context: any;
  fn: Function;
  args: any[];
}


type CallFunc0 = () => any;
type CallFunc1<T1> = (arg1: T1) => any;
type CallFunc2<T1, T2> = (arg1: T1, arg2: T2) => any;
type CallFunc3<T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => any;
type CallFunc4<T1, T2, T3, T4> = (arg1: T1, arg2: T2, arg3: T3,
                                  arg4: T4) => any;
type CallFunc5<T1, T2, T3, T4, T5> = (arg1: T1, arg2: T2, arg3: T3,
                                      arg4: T4, arg5: T5) => any;
type CallFuncRest = (...args: any[]) => any;

type CallEffectArg<F> = F | [any, F] | {context: any, fn: F};


interface CallEffectFactory<R> {
  (fn: CallEffectArg<CallFunc0>): R;
  <T1>(fn: CallEffectArg<CallFunc1<T1>>,
       arg1: T1): R;
  <T1, T2>(fn: CallEffectArg<CallFunc2<T1, T2>>,
           arg1: T1, arg2: T2): R;
  <T1, T2, T3>(fn: CallEffectArg<CallFunc3<T1, T2, T3>>,
               arg1: T1, arg2: T2, arg3: T3): R;
  <T1, T2, T3, T4>(fn: CallEffectArg<CallFunc4<T1, T2, T3, T4>>,
                   arg1: T1, arg2: T2, arg3: T3, arg4: T4): R;
  (fn: CallEffectArg<CallFuncRest>, ...args: any[]): R;
}


interface CallEffect {
  CALL: CallEffectDescriptor;
}

export const call: CallEffectFactory<CallEffect>;

export function apply(context: any, fn: CallFunc0): CallEffect;
export function apply<T1>(context: any, fn: CallFunc1<T1>, 
                          args: [T1]): CallEffect;
export function apply<T1, T2>(context: any, fn: CallFunc2<T1, T2>,
                          args: [T1, T2]): CallEffect;
export function apply<T1, T2, T3>(context: any, fn: CallFunc3<T1, T2, T3>,
                          args: [T1, T2, T3]): CallEffect;
export function apply<T1, T2, T3, T4>(context: any, 
                                      fn: CallFunc4<T1, T2, T3, T4>,
                          args: [T1, T2, T3, T4]): CallEffect;
export function apply(context: any, fn: CallFuncRest, 
                      ...args: any[]): CallEffect;


interface CpsEffect {
  CPS: CallEffectDescriptor;
}

type CpsCallback = (error: any, result: any) => void;

export function cps(fn: CallEffectArg<CallFunc1<CpsCallback>>): CpsEffect;
export function cps<T1>(fn: CallEffectArg<CallFunc2<T1, CpsCallback>>, 
                        arg1: T1): CpsEffect;
export function cps<T1, T2>(fn: CallEffectArg<CallFunc3<T1, T2, CpsCallback>>,
                            arg1: T1, arg2: T2): CpsEffect;
export function cps<T1, T2, T3>(
  fn: CallEffectArg<CallFunc4<T1, T2, T3, CpsCallback>>,
  arg1: T1, arg2: T2, arg3: T3): CpsEffect;
export function cps<T1, T2, T3, T4>(
  fn: CallEffectArg<CallFunc5<T1, T2, T3, T4, CpsCallback>>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): CpsEffect;


interface ForkEffectDescriptor extends CallEffectDescriptor {
  detached?: boolean;
}

interface ForkEffect {
  FORK: ForkEffectDescriptor;
}

export const fork: CallEffectFactory<ForkEffect>;
export const spawn: CallEffectFactory<ForkEffect>;


interface JoinEffect {
  JOIN: Task;
}

export function join(task: Task): JoinEffect;


interface CancelEffect {
  CANCEL: Task;
}

export function cancel(task: Task): CancelEffect;


interface SelectEffectDescriptor {
  selector(state: any, ...args: any[]): any;
  args: any[];
}

interface SelectEffect {
  SELECT: SelectEffectDescriptor;
}

export function select(): SelectEffect;
export function select<S>(selector: CallFunc1<S>): SelectEffect;
export function select<S, T1>(selector: CallFunc2<S, T1>, 
                              arg1: T1): SelectEffect;
export function select<S, T1, T2>(selector: CallFunc3<S, T1, T2>, 
                              arg1: T1, arg2: T2): SelectEffect;
export function select<S, T1, T2, T3>(selector: CallFunc4<S, T1, T2, T3>, 
                              arg1: T1, arg2: T2, arg3: T3): SelectEffect;
export function select<S, T1, T2, T3, T4>(
  selector: CallFunc5<S, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): SelectEffect;


interface ActionChannelEffectDescriptor<T> {
  pattern: Pattern<T>;
  buffer: Buffer<T>;
}

interface ActionChannelEffect<T> {
  ACTION_CHANNEL: ActionChannelEffectDescriptor<T>;
}

export function actionChannel<T>(pattern: Pattern<T>,
                              buffer?: Buffer<T>): ActionChannelEffect<T>;


interface CancelledEffect {
  CANCELLED: {};
}

export function cancelled(): CancelledEffect;


export type Effect = 
  TakeEffect<any> |
  PutEffect<any> |  
  RaceEffect | CallEffect |
  CpsEffect | ForkEffect | JoinEffect | CancelEffect | SelectEffect |
  ActionChannelEffect<any> | CancelledEffect;


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
  <A>(pattern: Pattern<A>, worker: HelperFunc0<A>): ForkEffect;
  <A, T1>(pattern: Pattern<A>,
          worker: HelperFunc1<A, T1>, arg1: T1): ForkEffect;
  <A, T1, T2>(pattern: Pattern<A>,
              worker: HelperFunc2<A, T1, T2>,
              arg1: T1, arg2: T2): ForkEffect;
  <A, T1, T2, T3>(pattern: Pattern<A>,
                  worker: HelperFunc3<A, T1, T2, T3>,
                  arg1: T1, arg2: T2, arg3: T3): ForkEffect;
  <A, T1, T2, T3, T4>(pattern: Pattern<A>,
                      worker: HelperFunc4<A, T1, T2, T3, T4>,
                      arg1: T1, arg2: T2, arg3: T3, arg4: T4): ForkEffect;
  <A, T1, T2, T3, T4, T5>(pattern: Pattern<A>,
                          worker: HelperFuncRest<A, T1, T2, T3, T4, T5>,
                          arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5,
                          ...rest: any[]): ForkEffect;
}

interface ThrottleHelper {
  <A>(ms: number, pattern: Pattern<A>, worker: HelperFunc0<A>): ForkEffect;
  <A, T1>(ms: number,
          pattern: Pattern<A>,
          worker: HelperFunc1<A, T1>, arg1: T1): ForkEffect;
  <A, T1, T2>(ms: number,
              pattern: Pattern<A>,
              worker: HelperFunc2<A, T1, T2>,
              arg1: T1, arg2: T2): ForkEffect;
  <A, T1, T2, T3>(ms: number,
                  pattern: Pattern<A>,
                  worker: HelperFunc3<A, T1, T2, T3>,
                  arg1: T1, arg2: T2, arg3: T3): ForkEffect;
  <A, T1, T2, T3, T4>(ms: number,
                      pattern: Pattern<A>,
                      worker: HelperFunc4<A, T1, T2, T3, T4>,
                      arg1: T1, arg2: T2, arg3: T3, arg4: T4): ForkEffect;
  <A, T1, T2, T3, T4, T5>(ms: number,
                          pattern: Pattern<A>,
                          worker: HelperFuncRest<A, T1, T2, T3, T4, T5>,
                          arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5,
                          ...rest: any[]): ForkEffect;
}

export const takeEvery: TakeHelper;
export const takeLatest: TakeHelper;
export const throttle: ThrottleHelper;
