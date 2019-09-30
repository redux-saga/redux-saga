import { Action } from "redux";
import {
  ActionPattern,
  call as rawCall,
  cancelled as rawCancelled,
  Effect,
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
