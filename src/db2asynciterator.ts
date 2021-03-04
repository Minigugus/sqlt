interface Deferable<T> {
  lock: Promise<T>;
  resolve: (value: T) => void;
  reject: (err: any) => void;
}

function deferable<T>(): Deferable<T> {
  let resolve: (value: T) => void, reject: (err: any) => void;
  return ({
    lock: new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    }),
    resolve: resolve!,
    reject: reject!
  })
}

const END_SYMBOL = Symbol();

export class AsyncIterableWithCallback<T> implements AsyncIterator<T> {
  #end = false;
  #cb2iter: Deferable<T | typeof END_SYMBOL> = deferable();
  #iter2cb: Deferable<void> = deferable();

  cb?= async (item: T) => {
    await this.#iter2cb.lock;
    this.#iter2cb = deferable();
    this.#cb2iter.resolve(item);
    this.#cb2iter = deferable();
    return this.#end;
  }

  async next(): Promise<IteratorResult<T, undefined>> {
    if (this.#end === false) {
      const { lock } = this.#cb2iter;
      this.#iter2cb.resolve();
      const value = await lock;
      if (value !== END_SYMBOL)
        return ({ done: false, value });
    }
    return ({ done: true, value: undefined });
  }

  async return(): Promise<IteratorResult<T, undefined>> {
    this.#end = true;
    this.#iter2cb.resolve();
    this.#cb2iter.resolve(END_SYMBOL);
    return ({ done: true, value: undefined });
  }

  async throw(e?: any): Promise<IteratorResult<T, undefined>> {
    this.#end = true;
    this.#iter2cb.resolve();
    this.#cb2iter.reject(e);
    return ({ done: true, value: undefined });
  }
}
