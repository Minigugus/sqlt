import type { Row, SimpleParameter } from './definitions';
import type { SQLCursor } from './cursor';
import type { SQLMultiStatementResponse, SQLResponse } from './response';
import type { SQLBuilder } from './request';

export interface SQLDriver {
  identifier(name: string): string;

  prepare(value: SimpleParameter): unknown;
  serialize(value: SimpleParameter): string;

  encode(builder: SQLBuilder, value: SimpleParameter, index: number): void;

  query(sql: string, parameters: SimpleParameter[]): PromiseLike<SQLResponse | SQLMultiStatementResponse>;
  cursor(size: number, sql: string, parameters: SimpleParameter[]): PromiseLike<SQLCursor>;

  end(): PromiseLike<void>;
}

export function unencodable(value: never): never {
  throw new Error('Cannot encode type ' + typeof value + ': ' + String(value));
}

export class SQLDriverControler<T extends SQLDriver = SQLDriver> {
  private ended: boolean = false;

  public constructor(
    public readonly driver: T
  ) {
  }

  print(value: SimpleParameter) {
    return this.driver.serialize(value);
  }

  encode(builder: SQLBuilder, value: SimpleParameter, index: number) {
    return this.driver.encode(builder, value, index);
  }

  identifier(name: string) {
    return this.driver.identifier(name);
  }

  query<T extends Row>(sql: string, parameters: SimpleParameter[]): PromiseLike<SQLResponse<T> | SQLMultiStatementResponse<T>> {
    if (this.ended)
      throw new Error('Driver connection closed');
    return <never>this.driver.query(sql, parameters); // Trust the user-provider type
  }

  cursor<T extends Row>(size: number, sql: string, parameters: SimpleParameter[]): PromiseLike<SQLCursor<T>> {
    if (this.ended)
      throw new Error('Driver connection closed');
    if (size < 1)
      throw new Error('Invalid chunk size: ' + size);
    return <never>this.driver.cursor(size, sql, parameters); // Trust the user-provider type
  }

  end() {
    this.ended = true;
    return this.driver.end();
  }
}
