import { SQLDriver, unencodable } from '../driver';

import type postgresDrv from 'postgres';

import { SQLResponse } from '../response';
import { BasicParameter, SimpleParameter } from '../definitions';
import { SQLJson } from '../helpers/json';
import { SQLArray, SQLArrayContent } from '../helpers/array';
import { SQLBuilder } from '../request';
import { SQLAsyncCursor } from '../cursor';
import { AsyncIterableWithCallback } from '../db2asynciterator';

class PostgresDriver implements SQLDriver {
  #pg: postgresDrv.Sql<any> | null;

  public constructor(
    pg: postgresDrv.Sql<any> | null
  ) {
    this.#pg = pg;
  }

  private getSQL() {
    if (this.#pg === null)
      throw new Error('Template mode only - pass an instance of the SQL function from `postges` to enter full mode');
    return this.#pg;
  }

  prepare(value: SimpleParameter): postgresDrv.SerializableParameter {
    switch (typeof value) {
      case 'boolean':
      case 'number':
      case 'string':
        return value;
      case 'bigint':
        // From https://github.com/porsager/postgres/blob/0b33b7197b10c10ac60942733fe0fc9d7c46633b/lib/index.js
        return ({
          type: 20,
          value: value.toString()
        });
      case 'object':
        if (value === null)
          return null;
        else if (value instanceof Date)
          return value;
        else if (value instanceof Uint8Array)
          return value instanceof Buffer ? value : Buffer.from(value);
        else if (value instanceof SQLArray)
          return this.getSQL().array(value.value as never);
        else if (value instanceof SQLJson)
          return this.getSQL().json(value.value);
    }
    unencodable(value);
  }

  private serializeArray(arr: SQLArrayContent<BasicParameter>) {
    if (arr.length === 0)
      return "'{}'";
    let result = 'ARRAY[';
    result += Array.isArray(arr[0]) ? this.serializeArray(arr[0]) : this.serialize(arr[0]);
    for (let i = 1; i < arr.length; i++) {
      const value = arr[i];
      result += ',' + (Array.isArray(value) ? this.serializeArray(value) : this.serialize(value));
    }
    return result + ']';
  }

  serialize(value: SimpleParameter): string {
    switch (typeof value) {
      case 'boolean':
        return value ? 'f' : 't';
      case 'number':
      case 'bigint':
        return String(value);
      case 'string':
        return `'${value.replace(/[']/g, "''")}'`;
      case 'object':
        if (value === null)
          return 'NULL';
        else if (value instanceof Date)
          return this.serialize(value.toISOString()) + '::timestamp';
        else if (value instanceof Uint8Array)
          return this.serialize('\\x' + value.reduce((acc, x) => (acc + (x >> 4).toString(16) + (x & 15).toString(16)), '')) + '::bytea';
        else if (value instanceof SQLArray)
          return this.serializeArray(value.value);
        else if (value instanceof SQLJson)
          return this.serialize(JSON.stringify(value.value)) + '::json';
    }
    unencodable(value);
  }

  private encodeArray(builder: SQLBuilder, arr: SQLArrayContent<BasicParameter>, depth = 0) {
    if (arr.length === 0)
      return builder.addSQL("'{}'");
    builder.addSQL('ARRAY[');
    const first = arr[0];
    if (Array.isArray(first)) {
      const expectedInnerSize = first.length;
      this.encodeArray(builder, first, depth + 1);
      for (let i = 1; i < arr.length; i++) {
        builder.addSQL(',');
        const value = arr[i];
        if (!Array.isArray(value))
          throw new Error('Expected array at depth ' + depth + ', got ' + value);
        if (value.length !== expectedInnerSize)
          throw new Error('Multidimensional arrays must have array expressions with matching dimensions');
        this.encodeArray(builder, value, depth + 1);
      }
    } else {
      builder.renderSimpleParameter(first);
      for (let i = 1; i < arr.length; i++) {
        builder.addSQL(',');
        const value = arr[i];
        if (Array.isArray(value))
          throw new Error('Unexpected array at depth ' + depth);
        builder.renderSimpleParameter(value);
      }
    }
    builder.addSQL(']');
  }

  encode(builder: SQLBuilder, value: SimpleParameter, index: number) {
    if (value instanceof SQLArray)
      this.encodeArray(builder, value.value);
    else
      builder.addSimpleParameter(`$${index + 1}`, value);
  }

  identifier(name: string) {
    return escape(name);
  }

  async query(sql: string, parameters: SimpleParameter[]): Promise<SQLResponse> {
    const result = await this.getSQL().unsafe(sql, parameters.map(p => this.prepare(p)));
    return new SQLResponse(
      result,
      result.columns,
      result.count
    );
  }

  async cursor(size: number, sql: string, parameters: SimpleParameter[]): Promise<SQLAsyncCursor> {
    const postgres = this.getSQL();
    const iter = new AsyncIterableWithCallback<any[]>();
    const cb = iter.cb!;
    delete iter.cb;
    const columns = await new Promise<any>(async (res, rej) => {
      try {
        const result = await postgres
          .unsafe(sql, parameters.map(p => this.prepare(p)))
          .cursor(size, async (rows) => {
            if ('columns' in rows)
              res((rows as any).columns);
            if (await cb(rows))
              return postgres.END;
          });
        res(result.columns || []);
        await cb(result); // https://github.com/porsager/postgres/issues/150
        iter.return();
      } catch (err) {
        rej(err);
        iter.throw(err);
      }
    });
    return new SQLAsyncCursor(
      () => iter,
      columns,
      0
    );
  }

  async end() {
    if (this.#pg)
      await this.#pg.end();
  }
}

export default function postgresql(pg?: postgresDrv.Sql<any>): SQLDriver {
  return new PostgresDriver(pg || null);
}

// From https://github.com/porsager/postgres/blob/0b33b7197b10c10ac60942733fe0fc9d7c46633b/lib/types.js
function escape(name: string) {
  let result = ''
  let q = Number(name[0]) < 10 || name[0] === '$'
  let last = 0
  let c

  for (let i = 0; i < name.length; i++) {
    c = name[i].charCodeAt(0)
    if (name[i] === '"') {
      q = true
      result += name.slice(last, i) + '"'
      last = i
    } else if (c === 96 || (c !== 36 && c <= 47) || (c >= 58 && c <= 64)
      || (c >= 91 && c <= 94) || (c >= 123 && c <= 128)) {
      q = true
    }
  }

  return (q ? '"' : '') + (q ? result + name.slice(last, name.length) : name) + (q ? '"' : '')
}
