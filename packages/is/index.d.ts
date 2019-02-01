import { ActionPattern, Buffer, Channel, GuardPredicate, Pattern, Task, ValidEffect } from '@redux-saga/types'

export const array: GuardPredicate<Array<any>>
export const buffer: GuardPredicate<Buffer<any>>
export const channel: GuardPredicate<Channel<any>>
export const effect: GuardPredicate<ValidEffect>
export const func: GuardPredicate<Function>
export const iterable: GuardPredicate<Iterable<any>>
export const iterator: GuardPredicate<Iterator<any>>
export const notUndef: GuardPredicate<any>
export const number: GuardPredicate<number>
export const object: GuardPredicate<object>
export const observable: GuardPredicate<{ subscribe: Function }>
export const pattern: GuardPredicate<Pattern<any> | ActionPattern>
export const promise: GuardPredicate<Promise<any>>
export const string: GuardPredicate<string>
export const stringableFunc: GuardPredicate<Function>
export const task: GuardPredicate<Task>
export const undef: GuardPredicate<undefined>
