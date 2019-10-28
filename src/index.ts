import { Action } from "redux";
import { Buffer } from "redux-saga";
import {
  actionChannel as rawActionChannel,
  ActionPattern,
  call as rawCall,
  cancelled as rawCancelled,
  Effect,
  put as rawPut,
  race as rawRace,
  select as rawSelect,
  take as rawTake,
} from "redux-saga/effects";

// tslint:disable: readonly-array

type SagaGenerator<RT> = Generator<Effect<any>, RT, any>;

type UnwrapReturnType<R> = R extends SagaGenerator<infer RT>
  ? RT
  : R extends Promise<infer PromiseValue>
  ? PromiseValue
  : R;

export function* take<A extends Action>(
  pattern?: ActionPattern<A>,
): SagaGenerator<A> {
  return yield rawTake(pattern);
}

export function* call<Args extends any[], R>(
  fn: (...args: Args) => R,
  ...args: Args
): SagaGenerator<UnwrapReturnType<R>> {
  return yield rawCall(fn, ...args);
}

export function select(): SagaGenerator<any>;
export function select<Args extends any[], R>(
  selector: (state: any, ...args: Args) => R,
  ...args: Args
): SagaGenerator<R>;
export function* select<Args extends any[], R>(
  selector?: (state: any, ...args: Args) => R,
  ...args: Args
): SagaGenerator<R> {
  return selector
    ? yield rawSelect(selector as any, ...args)
    : yield rawSelect();
}

export function* cancelled(): SagaGenerator<boolean> {
  return yield rawCancelled();
}

export function* put<T extends Action>(action: T): SagaGenerator<T> {
  return yield rawPut(action);
}

export function race<T extends object>(
  effects: T,
): SagaGenerator<{ [P in keyof T]?: UnwrapReturnType<T[P]> }>;
export function race<T>(effects: T[]): SagaGenerator<UnwrapReturnType<T>>;
export function* race<T extends object>(
  effects: T,
): SagaGenerator<{ [P in keyof T]?: UnwrapReturnType<T[P]> }> {
  return yield rawRace(effects as any);
}

export function* actionChannel<A extends Action>(
  ...args: [ActionPattern<A>] | [ActionPattern<A>, Buffer<A>]
): SagaGenerator<ActionPattern<A>> {
  return yield rawActionChannel(...(args as [ActionPattern<A>, Buffer<A>]));
}
