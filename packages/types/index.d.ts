import { Action } from "redux";

export type GuardPredicate<G extends T, T = any> = (arg: T) => arg is G;

type ActionType = string | number | symbol;

export type Predicate<T> = (arg: T) => boolean;

type StringableActionCreator<A extends Action = Action> = {
  (...args: any[]): A;
  toString(): string;
};

type SubPattern<T> =
  | Predicate<T>
  | StringableActionCreator
  | ActionType;

export type Pattern<T> =
  | SubPattern<T>
  | SubPattern<T>[];

type ActionSubPattern<Guard extends Action = Action> =
  | GuardPredicate<Guard, Action>
  | StringableActionCreator<Guard>
  | Predicate<Action>
  | ActionType

export type ActionPattern<Guard extends Action = Action> =
  | ActionSubPattern<Guard>
  | ActionSubPattern<Guard>[];

export interface Buffer<T> {
  isEmpty(): boolean;
  put(message: T): void;
  take(): T | undefined;
  flush(): T[];
}

export interface Channel<T> {
  take(cb: (message: T | END) => void): void;
  put(message: T | END): void;
  flush(cb: (items: T[] | END) => void): void;
  close(): void;
}

export interface Effect<T, P> {
  '@@redux-saga/IO': true;
  combinator: false;
  type: T;
  payload: P;
}

export type CombinedEffects<E> = {[key: string]: E} | E[];

export interface CombinatorEffect<T, E> {
  '@@redux-saga/IO': true;
  combinator: true;
  type: T;
  payload: CombinedEffects<E>;
}

export type AnyEffect = Effect<any, any>;
export interface AnyCombinatorEffect extends CombinatorEffect<any, ValidEffect> {}

export type ValidEffect = AnyEffect | AnyCombinatorEffect;

export type END = { type: '@@redux-saga/CHANNEL_END' };

/**
 * Annotate return type of generators with `SagaIterator` to get strict
 * type-checking of yielded effects.
 */
export type SagaIterator = IterableIterator<ValidEffect>;

export interface Task {
  isRunning(): boolean;
  isCancelled(): boolean;
  result<T = any>(): T | undefined;
  error(): any | undefined;
  toPromise<T = any>(): Promise<T>;
  cancel(): void;
  setContext<C extends object>(props: Partial<C>): void;
}
