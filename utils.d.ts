import {
  Pattern, Effect,
  TakeEffectDescriptor, ChannelTakeEffectDescriptor,
  PutEffectDescriptor, ChannelPutEffectDescriptor,
  AllEffectDescriptor, RaceEffectDescriptor,
  CallEffectDescriptor, ForkEffectDescriptor,
  JoinEffectDescriptor, CancelEffectDescriptor,
  SelectEffectDescriptor, ActionChannelEffectDescriptor,
  CancelledEffectDescriptor, FlushEffectDescriptor,
  GetContextEffectDescriptor, SetContextEffectDescriptor,
} from "./effects";
import {Task, Channel, Buffer, SagaIterator} from "./index";


export const TASK: string;
export const SAGA_ACTION: symbol;

export function noop(): void;

export type GuardPredicate<T> = (arg: any) => arg is T;

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
  pattern: GuardPredicate<Pattern>;
  channel: GuardPredicate<Channel<any>>;
  helper: GuardPredicate<SagaIterator>;
  stringableFunc: GuardPredicate<Function>;
};

interface Deferred<R> {
  resolve(result: R): void;
  reject(error: any): void;
  promise: Promise<R>;
}

export function deferred<T, R>(props?: T): T & Deferred<R>;

export function arrayOfDeffered<T>(length: number): Deferred<T>[];

interface MockTask extends Task {
  setRunning(running: boolean): void;
  setResult(result: any): void;
  setError(error: any): void;
}

export function createMockTask(): MockTask;

export const asEffect: {
  take(effect: Effect):
    undefined | TakeEffectDescriptor | ChannelTakeEffectDescriptor<any>;
  put(effect: Effect):
    undefined | PutEffectDescriptor<any> | ChannelPutEffectDescriptor<any>;
  all(effect: Effect): undefined | AllEffectDescriptor;
  race(effect: Effect): undefined | RaceEffectDescriptor;
  call(effect: Effect): undefined | CallEffectDescriptor;
  cps(effect: Effect): undefined | CallEffectDescriptor;
  fork(effect: Effect): undefined | ForkEffectDescriptor;
  join(effect: Effect): undefined | JoinEffectDescriptor;
  cancel(effect: Effect): undefined | CancelEffectDescriptor;
  select(effect: Effect): undefined | SelectEffectDescriptor;
  actionChannel(effect: Effect): undefined | ActionChannelEffectDescriptor;
  cancelled(effect: Effect): undefined | CancelledEffectDescriptor;
  flush(effect: Effect): undefined | FlushEffectDescriptor<any>;
  getContext(effect: Effect): undefined | GetContextEffectDescriptor;
  setContext(effect: Effect): undefined | SetContextEffectDescriptor<any>;
};
