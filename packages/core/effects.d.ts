import {Action, AnyAction} from "redux";
import {
  END, TakeableChannel, PuttableChannel, FlushableChannel,
  Task, Buffer, Predicate,
} from "./index";
import {GuardPredicate} from "./utils";

export type ActionType = string | number | symbol;

export type StringableActionCreator<A extends Action = Action> = {
  (...args: any[]): A;
  toString(): string;
};

export type SubPattern<T> =
  | Predicate<T>
  | StringableActionCreator
  | ActionType;

export type Pattern<T> =
  | SubPattern<T>
  | SubPattern<T>[];

export type ActionSubPattern<Guard extends Action = Action> =
  | GuardPredicate<Guard, Action>
  | StringableActionCreator<Guard>
  | Predicate<Action>
  | ActionType

export type ActionPattern<Guard extends Action = Action> =
  | ActionSubPattern<Guard>
  | ActionSubPattern<Guard>[];


export interface TakeEffectDescriptor {
  pattern: ActionPattern;
  maybe?: boolean;
}

export interface ChannelTakeEffectDescriptor<T> {
  channel: TakeableChannel<T>;
  pattern?: Pattern<T>;
  maybe?: boolean;
}

export interface TakeEffect {
  type: 'TAKE';
  payload: TakeEffectDescriptor;
}

export interface ChannelTakeEffect<T> {
  type: 'TAKE';
  payload: ChannelTakeEffectDescriptor<T>;
}

export interface Take {
  <A extends Action>(pattern?: ActionPattern<A>): TakeEffect;
  <T>(channel: TakeableChannel<T>, multicastPattern?: Pattern<T>): ChannelTakeEffect<T>;
}

export const take: Take;
export const takeMaybe: Take;


export interface PutEffectDescriptor<A extends Action> {
  action: A;
  channel: null;
  resolve?: boolean;
}

export interface ChannelPutEffectDescriptor<T> {
  action: T;
  channel: PuttableChannel<T>;
  resolve?: boolean;
}

export interface PutEffect<A extends Action = AnyAction> {
  type: 'PUT';
  payload: PutEffectDescriptor<A>;
}

export interface ChannelPutEffect<T> {
  type: 'PUT';
  payload: ChannelPutEffectDescriptor<T>;
}

export interface Put {
  <A extends Action>(action: A): PutEffect<A>;
  <T>(channel: PuttableChannel<T>, action: T | END): ChannelPutEffect<T>;
}

export const put: Put;
export const putResolve: Put;

export type GenericAllEffectDescriptor<T> = T[] | {[key: string]: T};

export interface GenericAllEffect<T> {
  type: 'ALL';
  payload: GenericAllEffectDescriptor<T>;
}

export type AllEffectDescriptor = GenericAllEffectDescriptor<Effect>;

export interface AllEffect {
  type: 'ALL'
  payload: AllEffectDescriptor;
}

export function all(effects: Effect[]): AllEffect;
export function all(effects: {[key: string]: Effect}): AllEffect;

export function all<T>(effects: T[]): GenericAllEffect<T>;
export function all<T>(effects: {[key: string]: T}): GenericAllEffect<T>;


export type GenericRaceEffectDescriptor<T> = {[key: string]: T};

export interface GenericRaceEffect<T> {
  type: 'RACE';
  payload: GenericRaceEffectDescriptor<T>;
}

export type RaceEffectDescriptor = GenericRaceEffectDescriptor<Effect>;

export interface RaceEffect {
  type: 'RACE';
  payload: RaceEffectDescriptor;
}

export function race(effects: Effect[]): RaceEffect;
export function race(effects: {[key: string]: Effect}): RaceEffect;

export function race<T>(effects: T[]): GenericRaceEffect<T>;
export function race<T>(effects: {[key: string]: T}): GenericRaceEffect<T>;


export interface CallEffectDescriptor {
  context: any;
  fn: Function;
  args: any[];
}

export interface CallEffect {
  type: 'CALL';
  payload: CallEffectDescriptor;
}

type Func0<R> = () => R;
type Func1<R, T1> = (arg1: T1) => R;
type Func2<R, T1, T2> = (arg1: T1, arg2: T2) => R;
type Func3<R, T1, T2, T3> = (arg1: T1, arg2: T2, arg3: T3) => R;
type Func4<R, T1, T2, T3, T4> = (arg1: T1, arg2: T2, arg3: T3, arg4: T4) => R;
type Func5<R, T1, T2, T3, T4, T5> = (arg1: T1, arg2: T2, arg3: T3,
                                     arg4: T4, arg5: T5) => R;
type Func6Rest<R, T1, T2, T3, T4, T5, T6> = (arg1: T1, arg2: T2, arg3: T3,
                                             arg4: T4, arg5: T5, arg6: T6,
                                             ...rest: any[]) => R;

export type CallEffectFn<F extends Function> =
  F | [any, F] | {context: any, fn: F};

export type CallEffectNamedFn<C extends {[P in Name]: Function},
                              Name extends string> =
  [C, Name] | {context: C, fn: Name};


interface CallEffectFactory<Effect> {
  <C extends {[P in N]: Func0<R>}, N extends string, R>(
    fn: CallEffectNamedFn<C, N>): Effect;
  <C extends {[P in N]: Func1<R, T1>}, N extends string, R, T1>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1): Effect;
  <C extends {[P in N]: Func2<R, T1, T2>}, N extends string, R, T1, T2>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2): Effect;
  <C extends {[P in N]: Func3<R, T1, T2, T3>}, N extends string,
   R, T1, T2, T3>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3): Effect;
  <C extends {[P in N]: Func4<R, T1, T2, T3, T4>}, N extends string,
   R, T1, T2, T3, T4>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3, arg4: T4): Effect;
  <C extends {[P in N]: Func5<R, T1, T2, T3, T4, T5>}, N extends string,
   R, T1, T2, T3, T4, T5>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): Effect;
  <C extends {[P in N]: Func6Rest<R, T1, T2, T3, T4, T5, T6>}, N extends string,
   R, T1, T2, T3, T4, T5, T6>(
    fn: CallEffectNamedFn<C, N>,
    arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
    ...rest: any[]): Effect;

  <R>(fn: CallEffectFn<Func0<R>>): Effect;
  <R, T1>(fn: CallEffectFn<Func1<R, T1>>,
       arg1: T1): Effect;
  <R, T1, T2>(fn: CallEffectFn<Func2<R, T1, T2>>,
           arg1: T1, arg2: T2): Effect;
  <R, T1, T2, T3>(fn: CallEffectFn<Func3<R, T1, T2, T3>>,
                  arg1: T1, arg2: T2, arg3: T3): Effect;
  <R, T1, T2, T3, T4>(fn: CallEffectFn<Func4<R, T1, T2, T3, T4>>,
                      arg1: T1, arg2: T2, arg3: T3, arg4: T4): Effect;
  <R, T1, T2, T3, T4, T5>(fn: CallEffectFn<Func5<R, T1, T2, T3, T4, T5>>,
                          arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): Effect;
  <R, T1, T2, T3, T4, T5, T6>(fn: CallEffectFn<Func6Rest<R, T1, T2, T3, T4, T5, T6>>,
                              arg1: T1, arg2: T2, arg3: T3,
                              arg4: T4, arg5: T5, arg6: T6, ...rest: any[]): Effect;
}

export const call: CallEffectFactory<CallEffect>;


export function apply<C extends {[P in N]: Func0<R>},
                      N extends string, R>(
  context: C, fn: N): CallEffect;
export function apply<C extends {[P in N]: Func1<R, T1>},
                      N extends string,
                      R, T1>(
  context: C, fn: N,
  args: [T1]): CallEffect;
export function apply<C extends {[P in N]: Func2<R, T1, T2>},
                      N extends string,
                      R, T1, T2>(
  context: C, fn: N,
  args: [T1, T2]): CallEffect;
export function apply<C extends {[P in N]: Func3<R, T1, T2, T3>},
                      N extends string,
                      R, T1, T2, T3>(
  context: C, fn: N,
  args: [T1, T2, T3]): CallEffect;
export function apply<C extends {[P in N]: Func4<R, T1, T2, T3, T4>},
                      N extends string,
                      R, T1, T2, T3, T4>(
  context: C, fn: N,
  args: [T1, T2, T3, T4]): CallEffect;
export function apply<C extends {[P in N]: Func5<R, T1, T2, T3, T4, T5>},
                      N extends string,
                      R, T1, T2, T3, T4, T5>(
  context: C, fn: N,
  args: [T1, T2, T3, T4, T5]): CallEffect;
export function apply<C extends {[P in N]: Func6Rest<R, T1, T2, T3, T4, T5, T6>},
                      N extends string,
                      R, T1, T2, T3, T4, T5, T6>(
  context: C, fn: N,
  args: any[] & {
    0: T1; 1: T2; 2: T3; 3: T4; 4: T5; 5: T6;
  }): CallEffect;

export function apply<R>(context: any, fn: Func0<R>): CallEffect;
export function apply<R, T1>(context: any, fn: Func1<R, T1>,
                             args: [T1]): CallEffect;
export function apply<R, T1, T2>(context: any, fn: Func2<R, T1, T2>,
                                 args: [T1, T2]): CallEffect;
export function apply<R, T1, T2, T3>(context: any, fn: Func3<R, T1, T2, T3>,
                                     args: [T1, T2, T3]): CallEffect;
export function apply<R, T1, T2, T3, T4>(context: any,
                                         fn: Func4<R, T1, T2, T3, T4>,
                                         args: [T1, T2, T3, T4]): CallEffect;
export function apply<R, T1, T2, T3, T4, T5>(
  context: any, fn: Func5<R, T1, T2, T3, T4, T5>, args: [T1, T2, T3, T4, T5],
): CallEffect;
export function apply<R, T1, T2, T3, T4, T5, T6>(
  context: any, fn: Func6Rest<R, T1, T2, T3, T4, T5, T6>, args: any[] & {
    0: T1; 1: T2; 2: T3; 3: T4; 4: T5; 5: T6;
  },
): CallEffect;


export interface CpsEffect {
  type: 'CPS';
  payload: CallEffectDescriptor;
}

interface CpsCallback<R> {
  (error: any, result: R): void;
  cancel?(): void;
}

export function cps<C extends {[P in N]: Func1<void, CpsCallback<R>>},
                    N extends string, R>(
  fn: CallEffectNamedFn<C, N>): CpsEffect;
export function cps<C extends {[P in N]: Func2<void, T1, CpsCallback<R>>},
                    N extends string,
                    R, T1>(
  fn: CallEffectNamedFn<C, N>,
  arg1: T1): CpsEffect;
export function cps<C extends {[P in N]: Func3<void, T1, T2, CpsCallback<R>>},
                    N extends string,
                    R, T1, T2>(
  fn: CallEffectNamedFn<C, N>,
  arg1: T1, arg2: T2): CpsEffect;
export function cps<C extends {[P in N]: Func4<void, T1, T2, T3, CpsCallback<R>>},
                    N extends string,
                    R, T1, T2, T3>(
  fn: CallEffectNamedFn<C, N>,
  arg1: T1, arg2: T2, arg3: T3): CpsEffect;
export function cps<C extends {[P in N]: Func5<void, T1, T2, T3, T4, CpsCallback<R>>},
                    N extends string,
                    R, T1, T2, T3, T4>(
  fn: CallEffectNamedFn<C, N>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): CpsEffect;
export function cps<C extends {[P in N]:
                                  Func6Rest<void, T1, T2, T3, T4, T5, CpsCallback<R>>},
                    N extends string,
                    R, T1, T2, T3, T4, T5>(
  fn: CallEffectNamedFn<C, N>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, ...rest: any[]): CpsEffect;

export function cps<R>(fn: CallEffectFn<Func1<void, CpsCallback<R>>>): CpsEffect;
export function cps<R, T1>(fn: CallEffectFn<Func2<void, T1, CpsCallback<R>>>,
                           arg1: T1): CpsEffect;
export function cps<R, T1, T2>(fn: CallEffectFn<Func3<void, T1, T2, CpsCallback<R>>>,
                               arg1: T1, arg2: T2): CpsEffect;
export function cps<R, T1, T2, T3>(
  fn: CallEffectFn<Func4<void, T1, T2, T3, CpsCallback<R>>>,
  arg1: T1, arg2: T2, arg3: T3): CpsEffect;
export function cps<R, T1, T2, T3, T4>(
  fn: CallEffectFn<Func5<void, T1, T2, T3, T4, CpsCallback<R>>>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): CpsEffect;
export function cps<R, T1, T2, T3, T4, T5>(
  fn: CallEffectFn<Func6Rest<void, T1, T2, T3, T4, T5, any>>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5,
  ...rest: any[]): CpsEffect;


export interface ForkEffectDescriptor extends CallEffectDescriptor {
  detached?: boolean;
}

export interface ForkEffect {
  type: 'FORK';
  payload: ForkEffectDescriptor;
}

export const fork: CallEffectFactory<ForkEffect>;
export const spawn: CallEffectFactory<ForkEffect>;


export type JoinEffectDescriptor = Task | Task[];

export interface JoinEffect {
  type: 'JOIN';
  payload: JoinEffectDescriptor;
}

export function join(task: Task): JoinEffect;
export function join(tasks: Task[]): JoinEffect;


type SELF_CANCELLATION = '@@redux-saga/SELF_CANCELLATION';
export type CancelEffectDescriptor = Task | Task[] | SELF_CANCELLATION;

export interface CancelEffect {
  type: 'CANCEL';
  payload: CancelEffectDescriptor;
}

export function cancel(): CancelEffect;
export function cancel(task: Task): CancelEffect;
export function cancel(tasks: Task[]): CancelEffect;


export interface SelectEffectDescriptor {
  selector(state: any, ...args: any[]): any;
  args: any[];
}

export interface SelectEffect {
  type: 'SELECT';
  payload: SelectEffectDescriptor;
}

export function select(): SelectEffect;
export function select<S, R>(selector: Func1<R, S>): SelectEffect;
export function select<S, R, T1>(selector: Func2<R, S, T1>,
                                 arg1: T1): SelectEffect;
export function select<S, R, T1, T2>(selector: Func3<R, S, T1, T2>,
                                     arg1: T1, arg2: T2): SelectEffect;
export function select<S, R, T1, T2, T3>(
  selector: Func4<R, S, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): SelectEffect;
export function select<S, R, T1, T2, T3, T4>(
  selector: Func5<R, S, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): SelectEffect;
export function select<S, R, T1, T2, T3, T4, T5>(
  selector: Func6Rest<R, S, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5,
  ...rest: any[]): SelectEffect;


export interface ActionChannelEffectDescriptor {
  pattern: ActionPattern;
  buffer?: Buffer<Action>;
}

export interface ActionChannelEffect {
  type: 'ACTION_CHANNEL';
  payload: ActionChannelEffectDescriptor;
}

export function actionChannel(
  pattern: ActionPattern, buffer?: Buffer<Action>,
): ActionChannelEffect;


export type CancelledEffectDescriptor = {};

export interface CancelledEffect {
  type: 'CANCELLED';
  payload: CancelledEffectDescriptor;
}

export function cancelled(): CancelledEffect;


export type FlushEffectDescriptor<T> = FlushableChannel<T>;

export interface FlushEffect<T> {
  type: 'FLUSH';
  payload: FlushEffectDescriptor<T>;
}

export function flush<T>(channel: FlushableChannel<T>): FlushEffect<T>;


export type GetContextEffectDescriptor = string;

export interface GetContextEffect {
  type: 'GET_CONTEXT';
  payload: GetContextEffectDescriptor;
}

export function getContext(prop: string): GetContextEffect;


export type SetContextEffectDescriptor<C extends object> = C;

export interface SetContextEffect<C extends object> {
  type: 'SET_CONTEXT';
  payload: SetContextEffectDescriptor<C>;
}

export function setContext<C extends object>(props: C): SetContextEffect<C>;


export interface RootEffect {
  root: true;
  saga(...args: any[]): Iterator<any>;
  args: any[];
}


export type Effect =
  RootEffect |
  TakeEffect | ChannelTakeEffect<any> |
  PutEffect<any> | ChannelPutEffect<any> |
  AllEffect | RaceEffect | CallEffect |
  CpsEffect | ForkEffect | JoinEffect | CancelEffect | SelectEffect |
  ActionChannelEffect | CancelledEffect | FlushEffect<any> |
  GetContextEffect | SetContextEffect<any>;


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



export function takeEvery<T>(
  channel: TakeableChannel<T>,
  worker: HelperFunc0<T>): ForkEffect;
export function takeEvery<T, T1>(
  channel: TakeableChannel<T>,
  worker: HelperFunc1<T, T1>,
  arg1: T1): ForkEffect;
export function takeEvery<T, T1, T2>(
  channel: TakeableChannel<T>,
  worker: HelperFunc2<T, T1, T2>,
  arg1: T1, arg2: T2): ForkEffect;
export function takeEvery<T, T1, T2, T3>(
  channel: TakeableChannel<T>,
  worker: HelperFunc3<T, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): ForkEffect;
export function takeEvery<T, T1, T2, T3, T4>(
  channel: TakeableChannel<T>,
  worker: HelperFunc4<T, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): ForkEffect;
export function takeEvery<T, T1, T2, T3, T4, T5>(
  channel: TakeableChannel<T>,
  worker: HelperFunc5<T, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): ForkEffect;
export function takeEvery<T, T1, T2, T3, T4, T5, T6>(
  channel: TakeableChannel<T>,
  worker: HelperFunc6Rest<T, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]): ForkEffect;

export function takeEvery<A extends Action>(
  pattern: ActionPattern<A>,
  worker: HelperFunc0<A>): ForkEffect;
export function takeEvery<A extends Action, T1>(
  pattern: ActionPattern<A>,
  worker: HelperFunc1<A, T1>,
  arg1: T1): ForkEffect;
export function takeEvery<A extends Action, T1, T2>(
  pattern: ActionPattern<A>,
  worker: HelperFunc2<A, T1, T2>,
  arg1: T1, arg2: T2): ForkEffect;
export function takeEvery<A extends Action, T1, T2, T3>(
  pattern: ActionPattern<A>,
  worker: HelperFunc3<A, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): ForkEffect;
export function takeEvery<A extends Action, T1, T2, T3, T4>(
  pattern: ActionPattern<A>,
  worker: HelperFunc4<A, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): ForkEffect;
export function takeEvery<A extends Action, T1, T2, T3, T4, T5>(
  pattern: ActionPattern<A>,
  worker: HelperFunc5<A, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): ForkEffect;
export function takeEvery<A extends Action, T1, T2, T3, T4, T5, T6>(
  pattern: ActionPattern<A>,
  worker: HelperFunc6Rest<A, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]): ForkEffect;


export const takeLatest: typeof takeEvery;
export const takeLeading: typeof takeEvery;


export function throttle<A extends Action>(
  ms: number, pattern: ActionPattern<A>,
  worker: HelperFunc0<A>): ForkEffect;
export function throttle<A extends Action, T1>(
  ms: number, pattern: ActionPattern<A>,
  worker: HelperFunc1<A, T1>,
  arg1: T1): ForkEffect;
export function throttle<A extends Action, T1, T2>(
  ms: number, pattern: ActionPattern<A>,
  worker: HelperFunc2<A, T1, T2>,
  arg1: T1, arg2: T2): ForkEffect;
export function throttle<A extends Action, T1, T2, T3>(
  ms: number, pattern: ActionPattern<A>,
  worker: HelperFunc3<A, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3): ForkEffect;
export function throttle<A extends Action, T1, T2, T3, T4>(
  ms: number, pattern: ActionPattern<A>,
  worker: HelperFunc4<A, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4): ForkEffect;
export function throttle<A extends Action, T1, T2, T3, T4, T5>(
  ms: number, pattern: ActionPattern<A>,
  worker: HelperFunc5<A, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5): ForkEffect;
export function throttle<A extends Action, T1, T2, T3, T4, T5, T6>(
  ms: number, pattern: ActionPattern<A>,
  worker: HelperFunc6Rest<A, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]): ForkEffect;


export function delay<T>(ms: number, val?: T): CallEffect;


export function retry<R>(
  maxTries: number,
  delayLength: number,
  fn: Func0<R>
): CallEffect

export function retry<R, T1>(
  maxTries: number,
  delayLength: number,
  fn: Func1<R, T1>,
  arg1: T1
): CallEffect

export function retry<R, T1, T2>(
  maxTries: number,
  delayLength: number,
  fn: Func2<R, T1, T2>,
  arg1: T1, arg2: T2,
): CallEffect

export function retry<R, T1, T2, T3>(
  maxTries: number,
  delayLength: number,
  fn: Func3<R, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3,
): CallEffect

export function retry<R, T1, T2, T3, T4>(
  maxTries: number,
  delayLength: number,
  fn: Func4<R, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4,
): CallEffect

export function retry<R, T1, T2, T3, T4, T5>(
  maxTries: number,
  delayLength: number,
  fn: Func5<R, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5,
): CallEffect

export function retry<R, T1, T2, T3, T4, T5, T6>(
  maxTries: number,
  delayLength: number,
  fn: Func6Rest<R, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6, ...rest: any[]
): CallEffect

export function debounce<A extends Action>(
  delayLength: number,
  pattern: ActionPattern<A>,
  worker: HelperFunc0<A>
): ForkEffect;
export function debounce<A extends Action, T1>(
  delayLength: number,
  pattern: ActionPattern<A>,
  worker: HelperFunc1<A, T1>,
  arg1: T1
): ForkEffect;
export function debounce<A extends Action, T1, T2>(
  delayLength: number,
  pattern: ActionPattern<A>,
  worker: HelperFunc2<A, T1, T2>,
  arg1: T1, arg2: T2
): ForkEffect;
export function debounce<A extends Action, T1, T2, T3>(
  delayLength: number,
  pattern: ActionPattern<A>,
  worker: HelperFunc3<A, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3
): ForkEffect;
export function debounce<A extends Action, T1, T2, T3, T4>(
  delayLength: number,
  pattern: ActionPattern<A>,
  worker: HelperFunc4<A, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4
): ForkEffect;
export function debounce<A extends Action, T1, T2, T3, T4, T5>(
  delayLength: number,
  pattern: ActionPattern<A>,
  worker: HelperFunc5<A, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5
): ForkEffect;
export function debounce<A extends Action, T1, T2, T3, T4, T5, T6>(
  delayLength: number,
  pattern: ActionPattern<A>,
  worker: HelperFunc6Rest<A, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]
): ForkEffect;

export function debounce<T>(
  delayLength: number,
  channel: TakeableChannel<T>,
  worker: HelperFunc0<T>
): ForkEffect;
export function debounce<T, T1>(
  delayLength: number,
  channel: TakeableChannel<T>,
  worker: HelperFunc1<T, T1>,
  arg1: T1
): ForkEffect;
export function debounce<T, T1, T2>(
  delayLength: number,
  channel: TakeableChannel<T>,
  worker: HelperFunc2<T, T1, T2>,
  arg1: T1, arg2: T2
): ForkEffect;
export function debounce<T, T1, T2, T3>(
  delayLength: number,
  channel: TakeableChannel<T>,
  worker: HelperFunc3<T, T1, T2, T3>,
  arg1: T1, arg2: T2, arg3: T3
): ForkEffect;
export function debounce<T, T1, T2, T3, T4>(
  delayLength: number,
  channel: TakeableChannel<T>,
  worker: HelperFunc4<T, T1, T2, T3, T4>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4
): ForkEffect;
export function debounce<T, T1, T2, T3, T4, T5>(
  delayLength: number,
  channel: TakeableChannel<T>,
  worker: HelperFunc5<T, T1, T2, T3, T4, T5>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5
): ForkEffect;
export function debounce<T, T1, T2, T3, T4, T5, T6>(
  delayLength: number,
  channel: TakeableChannel<T>,
  worker: HelperFunc6Rest<T, T1, T2, T3, T4, T5, T6>,
  arg1: T1, arg2: T2, arg3: T3, arg4: T4, arg5: T5, arg6: T6,
  ...rest: any[]
): ForkEffect;

export const effectTypes: {
  TAKE: 'TAKE',
  PUT: 'PUT',
  ALL: 'ALL',
  RACE: 'RACE',
  CALL: 'CALL',
  CPS: 'CPS',
  FORK: 'FORK',
  JOIN: 'JOIN',
  CANCEL: 'CANCEL',
  SELECT: 'SELECT',
  ACTION_CHANNEL: 'ACTION_CHANNEL',
  CANCELLED: 'CANCELLED',
  FLUSH: 'FLUSH',
  GET_CONTEXT: 'GET_CONTEXT',
  SET_CONTEXT: 'SET_CONTEXT',
}
