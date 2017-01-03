import {END} from "./index";

export type Predicate<T> = (arg: T) => boolean;

export interface Task {
  isRunning(): boolean;
  isCancelled(): boolean;
  result(): any | undefined;
  result<T>(): T | undefined;
  error(): any | undefined;
  done: Promise<any>;
  cancel(): void;
}

export interface Buffer<T> {
  isEmpty(): boolean;
  put(message: T): void;
  take(): T | undefined;
  flush?(): void;
}

export interface Channel<T> {
  take(cb: (message: T | END) => void): void;
  put?(message: T | END): void;
  flush(): void;
  close(): void;
}
