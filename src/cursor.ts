import type { Column, Row } from './definitions';

export class SQLCursor<T extends Row = Row> implements AsyncIterable<T[]> {
  private iterator: null | (() => AsyncIterator<T[]>);

  public constructor(
    iterator: () => AsyncIterator<T[]>,
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
