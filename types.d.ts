export type Predicate<T> = (arg: T) => boolean;

export interface Task {
  isRunning(): boolean;
  isCancelled(): boolean;
  result(): any;
  result<T>(): T;
  error(): any;
  done: Promise<any>;
  cancel(): void;
}

export interface Buffer<T> {
  isEmpty(): boolean;
  put(message: T): void;
  take(): T;
}

export interface Channel<T> {
  take(cb: (message: T) => void, matcher?: Predicate<T>): void;
  put?(message: T): void;
  close(): void;
}
