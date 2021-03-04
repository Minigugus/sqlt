import type { Row, SimpleParameter } from '../definitions';
import type { SQLResponse } from '../response';
import type { SQLBuilder } from '../request';
import type { SQLCursor } from '../cursor';
import type { SQLDriver } from '../driver';

import { SQLJson } from '../helpers/json';
import { SQLArray } from '../helpers/array';

/**
 * @deprecated
 */
export class NullDriver implements SQLDriver {
  prepare(value: SimpleParameter): unknown {
    if (
      value instanceof SQLArray ||
      value instanceof SQLJson
    )
      return value.value;
    return value;
  }

  serialize(value: SimpleParameter): string {
    return JSON.stringify(this.prepare(value));
  }

  encode(builder: SQLBuilder, value: SimpleParameter, index: number) {
    builder.addSimpleParameter('?', value);
  }

  identifier(name: string): string {
    throw new Error('Not supported by the underlying driver');
  }

  query(sql: string, parameters: SimpleParameter[]): PromiseLike<SQLResponse<Row>> {
    throw new Error('Not implemented by the underlying driver');
  }

  cursor(size: number, sql: string, parameters: SimpleParameter[]): PromiseLike<SQLCursor<Row>> {
    throw new Error('Not implemented by the underlying driver');
  }

  async end() { }
}

export default new NullDriver();
