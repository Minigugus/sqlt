import type { Column, Row } from './definitions';

export type SQLCursor<T extends Row = Row> = SQLAsyncCursor<T> | SQLSyncCursor<T>;

export class SQLAsyncCursor<T extends Row = Row> implements AsyncIterable<T[]> {
  private iterator: null | (() => (AsyncIterator<T[]>));

  public constructor(
    iterator: () => (AsyncIterator<T[]>),
    public readonly columns: Column[],
    public readonly count: number
  ) {
    this.iterator = iterator;
  }

  [Symbol.asyncIterator]() {
    const iter = this.iterator;
    if (iter === null)
      throw new Error('Rows already consumed');
    this.iterator = null;
    return iter();
  }
}

export class SQLSyncCursor<T extends Row = Row> implements Iterable<T[]> {
  private iterator: null | (() => (Iterator<T[]>));

  public constructor(
    iterator: () => (Iterator<T[]>),
    public readonly columns: Column[],
    public readonly count: number
  ) {
    this.iterator = iterator;
  }

  [Symbol.iterator]() {
    const iter = this.iterator;
    if (iter === null)
      throw new Error('Rows already consumed');
    this.iterator = null;
    return iter();
  }
}
