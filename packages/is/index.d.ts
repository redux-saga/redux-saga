// TODO: some of those guards need import types, they would have to be imported from `redux-saga` module
// that would introduce circular dependency, is it a problem in TS?
export type GuardPredicate<G extends T, T = any> = (arg: T) => arg is G;

export const array: GuardPredicate<Array<any>>;
export const buffer: GuardPredicate<Buffer<any>>;
export const channel: GuardPredicate<Channel<any>>;
export const effect: GuardPredicate<Effect>;
export const func: GuardPredicate<Function>;
export const iterable: GuardPredicate<Iterable<any>>;
export const iterator: GuardPredicate<Iterator<any>>;
export const notUndef: GuardPredicate<any>;
export const number: GuardPredicate<number>;
export const object: GuardPredicate<object>;
export const observable: GuardPredicate<{subscribe: Function}>;
export const pattern: GuardPredicate<Pattern<any> | ActionPattern>;
export const promise: GuardPredicate<Promise<any>>;
export const string: GuardPredicate<string>;
export const stringableFunc: GuardPredicate<Function>;
export const task: GuardPredicate<Task>;
export const undef: GuardPredicate<undefined>;
