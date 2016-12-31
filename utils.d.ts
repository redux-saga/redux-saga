import {
  Effect, TakeEffectDescriptor, PutEffectDescriptor,
  RaceEffectDescriptor, CallEffectDescriptor, ForkEffectDescriptor,
  SelectEffectDescriptor, ActionChannelEffectDescriptor
} from "./effects";
import {Predicate, Task} from "./types";


export const TASK: string;

export function noop(): void;

export const is: {
  undef: Predicate<any>;
  notUndef: Predicate<any>;
  func: Predicate<any>;
  number: Predicate<any>;
  array: Predicate<any>;
  promise: Predicate<any>;
  iterator: Predicate<any>;
  task: Predicate<any>;
  take: Predicate<any>;
  put: Predicate<any>;
  observable: Predicate<any>;
  buffer: Predicate<any>;
  pattern: Predicate<any>;
  stringableFunc: Predicate<any>;
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
  take<T>(effect: Effect): TakeEffectDescriptor<T>;
  put<T>(effect: Effect): PutEffectDescriptor<T>;
  race(effect: Effect): RaceEffectDescriptor;
  call(effect: Effect): CallEffectDescriptor;
  cps(effect: Effect): CallEffectDescriptor;
  fork(effect: Effect): ForkEffectDescriptor;
  join(effect: Effect): Task;
  cancel(effect: Effect): Task;
  select(effect: Effect): SelectEffectDescriptor;
  actionChannel<T>(effect: Effect): ActionChannelEffectDescriptor<T>;
  cancelled(effect: Effect): {};
};
