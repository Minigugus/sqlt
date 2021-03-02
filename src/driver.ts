import type { BasicParameter, Row, SimpleParameter } from './definitions';
import type { SQLArrayContent } from './helpers/array';
import { SQLCursor } from './cursor';
import { SQLArray } from './helpers/array';
import { SQLJson } from './helpers/json';
import { SQLResponse } from './response';
import { SQLBuilder } from './request';

export interface SQLDriver<T = unknown> {
  null(): T;
  boolean(value: boolean): T;
  number(value: number): T;
  bigint(value: bigint): T;
  string(value: string): T;
  date(value: Date): T;
  buffer(value: Uint8Array): T;
  array(value: SQLArrayContent<BasicParameter>): T;
  json(value: any, replacer: null | (number | string)[] | ((this: any, key: string, value: any) => any)): T;

  print(value: SimpleParameter): string;
  encode(builder: SQLBuilder, value: SimpleParameter, index: number): void;
  identifier(name: string): string;

  query(sql: string, parameters: SimpleParameter[]): PromiseLike<SQLResponse>;
  cursor(size: number, sql: string, parameters: T[]): PromiseLike<SQLCursor>;

  end(): PromiseLike<void>;
}

export function encodeParameter(driver: SQLDriver, value: SimpleParameter) {
  switch (typeof value) {
    case 'boolean':
      return driver.boolean(value);
    case 'number':
      return driver.number(value);
    case 'bigint':
      return driver.bigint(value);
    case 'string':
      return driver.string(value);
    case 'object':
      if (value === null)
        return driver.null();
      else if (value instanceof Date)
        return driver.date(value);
      else if (value instanceof Uint8Array)
        return driver.buffer(value);
      else if (value instanceof SQLArray)
        return driver.array(value.value);
      else if (value instanceof SQLJson)
        return driver.json(value.value, value.replacer);
  }
  throw new Error('Cannot encode type ' + typeof value + ': ' + String(value as undefined));
}

export class SQLDriverControler<T extends SQLDriver = SQLDriver> {
  private ended: boolean = false;

  public constructor(
    public readonly driver: T
  ) {
  }

  print(value: SimpleParameter) {
    return this.driver.print(value);
  }

  encode(builder: SQLBuilder, value: SimpleParameter, index: number) {
    return this.driver.encode(builder, value, index);
  }

  identifier(name: string) {
    return this.driver.identifier(name);
  }

  query<T extends Row>(sql: string, parameters: SimpleParameter[]): PromiseLike<SQLResponse<T>> {
    if (this.ended)
      throw new Error('Driver connection closed');
    return <never>this.driver.query(sql, parameters); // Trust the user
  }

  cursor<T extends Row>(size: number, sql: string, parameters: SimpleParameter[]): PromiseLike<SQLCursor<T>> {
    if (this.ended)
      throw new Error('Driver connection closed');
    return <never>this.driver.cursor(size, sql, parameters); // Trust the user
  }

  end() {
    this.ended = true;
    return this.driver.end();
  }
}
