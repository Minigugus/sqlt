import type { Column, Row } from './definitions';

export class SQLResponse<T extends Row = Row> implements Iterable<T> {
  public constructor(
    public readonly rows: T[],
    public readonly columns: Column[] = rows.length ? Object.keys(rows[0]).map(name => ({ name })) : [],
    public readonly count: number = rows.length
  ) {
  }

  [Symbol.iterator]() {
    return this.rows[Symbol.iterator]();
  }
}
