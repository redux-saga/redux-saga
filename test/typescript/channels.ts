import {
  buffers, Buffer, channel, Channel, END, eventChannel,
} from "redux-saga";

function testBuffers() {
  const b1: Buffer<{foo: string}> = buffers.none<{foo: string}>();

  const b2: Buffer<{foo: string}> = buffers.dropping<{foo: string}>();
  const b3: Buffer<{foo: string}> = buffers.dropping<{foo: string}>(42);

  const b4: Buffer<{foo: string}> = buffers.expanding<{foo: string}>();
  const b5: Buffer<{foo: string}> = buffers.expanding<{foo: string}>(42);

  const b6: Buffer<{foo: string}> = buffers.fixed<{foo: string}>();
  const b7: Buffer<{foo: string}> = buffers.fixed<{foo: string}>(42);

  const b8: Buffer<{foo: string}> = buffers.sliding<{foo: string}>();
  const b9: Buffer<{foo: string}> = buffers.sliding<{foo: string}>(42);

  const buffer = buffers.none<{foo: string}>();

  // typings:expect-error
  buffer.put({bar: 'bar'});
  buffer.put({foo: 'foo'});

  const isEmpty: boolean = buffer.isEmpty();

  const item = buffer.take();

  // typings:expect-error
  item.foo;  // item may be undefined

  const foo: string = item!.foo;

  if (buffer.flush)
    buffer.flush();
}

function testChannel() {
  const c1: Channel<{foo: string}> = channel<{foo: string}>();
  const c2: Channel<{foo: string}> = channel(buffers.none<{foo: string}>());

  // typings:expect-error
  c1.take((message: {bar: number} | END) => {});
  c1.take((message: {foo: string} | END) => {});

  if (c1.put) {
    // typings:expect-error
    c1.put({bar: 1});
    c1.put({foo: 'foo'});
    c1.put(END);
  }


  c1.flush();

  c1.close();
}

function testEventChannel(secs: number) {
  const subscribe = (emitter: (input: number | END) => void) => {
    const iv = setInterval(() => {
      secs -= 1
      if (secs > 0) {
        emitter(secs)
      } else {
        emitter(END)
        clearInterval(iv)
      }
    }, 1000);
    return () => {
      clearInterval(iv)
    }
  };
  const c1: Channel<number> = eventChannel<number>(subscribe);
  // typings:expect-error
  const c2: Channel<number> = eventChannel<number>(subscribe,
    buffers.none<string>());

  const c3: Channel<number> = eventChannel<number>(subscribe,
    buffers.none<number>());

  // typings:expect-error
  const c4: Channel<number> = eventChannel<number>(subscribe,
    buffers.none<number>(), (input: string) => true);

  const c5: Channel<number> = eventChannel<number>(subscribe,
    buffers.none<number>(), (input: number) => true);
}
