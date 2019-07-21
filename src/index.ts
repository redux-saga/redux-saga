import { Action } from "redux";
import {
  ActionPattern,
  call as rawCall,
  cancelled as rawCancelled,
  Effect,
  select as rawSelect,
  Tail,
  take as rawTake,
} from "redux-saga/effects";

// tslint:disable: readonly-array

export type SagaIterator<RT = any> = Generator<Effect<any>, RT, any>;

export type CallResult<RT> = RT extends SagaIterator<infer A>
  ? A
  : RT extends Promise<infer B>
  ? B
  : RT;

export function* take<A extends Action>(
  pattern?: ActionPattern<A>,
): SagaIterator<A> {
  return yield rawTake(pattern);
}

export function* call<Fn extends (...args: any[]) => any>(
  fn: Fn,
  ...args: Parameters<Fn>
): SagaIterator<CallResult<ReturnType<Fn>>> {
  return yield rawCall(fn, ...args);
}

export function* select<Fn extends (state: any, ...args: any[]) => any>(
  selector: Fn,
  ...args: Tail<Parameters<Fn>>
): SagaIterator<ReturnType<Fn>> {
  return yield rawSelect(selector, ...args);
}

export function* cancelled(): SagaIterator<boolean> {
  return yield rawCancelled();
}
