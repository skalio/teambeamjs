import { Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { streamPromise } from '../../src/utils/stream.js';

function createMockStream() {
  const stream = new Writable({
    write(chunk, encoding, callback) {
      callback();
    },
  });
  return stream;
}

describe('streamPromise', () => {
  it('resolves when "finish" is emitted', async () => {
    const stream = createMockStream();
    const promise = streamPromise(stream);
    stream.emit('finish');
    await expect(promise).resolves.toBeUndefined();
  });

  it('resolves when "end" is emitted', async () => {
    const stream = createMockStream();
    const promise = streamPromise(stream);
    stream.emit('end');
    await expect(promise).resolves.toBeUndefined();
  });

  it('rejects when "error" is emitted', async () => {
    const stream = createMockStream();
    const promise = streamPromise(stream);
    const error = new Error('fail!');
    stream.emit('error', error);
    await expect(promise).rejects.toThrow('fail!');
  });
});