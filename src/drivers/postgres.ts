import { encodeParameter, SQLDriver } from '../driver';

import { NullDriver } from './null';

import type postgresDrv from 'postgres';

import { SQLResponse } from '../response';
import { BasicParameter, SimpleParameter } from '../definitions';
import { SQLHelper } from '../helper';
import { SQLJson } from '../helpers/json';
import { array, SQLArray, SQLArrayContent } from '../helpers/array';
import { SQLBuilder } from '../request';

class PostgresDriver extends NullDriver {
  #pg: postgresDrv.Sql<any> | null;

  public constructor(
    pg: postgresDrv.Sql<any> | null
  ) {
    super();
    this.#pg = pg;
  }

  private getSQL() {
    if (this.#pg === null)
      throw new Error('Template mode only - pass an instance of the SQL function from `postges` to enter full mode');
    return this.#pg;
  }

  private encodeNeasted(v: any) {
    if (v instanceof SQLHelper)
      return encodeParameter(this, v as SQLArray | SQLJson);
    return v;
  }

  bigint(v: bigint) {
    // From https://github.com/porsager/postgres/blob/0b33b7197b10c10ac60942733fe0fc9d7c46633b/lib/index.js
    return ({
      type: 20,
      value: v.toString()
    });
  }

  buffer(v: Uint8Array) {
    if (v instanceof Buffer)
      return v;
    return Buffer.from(v);
  }

  array(v: SQLArrayContent<BasicParameter>): string {
    throw new Error('Unreachable');
  }

  json(v: any, replacer: null | (number | string)[]): unknown {
    return this.getSQL().json(super.json(v, replacer));
  }

  private printArray(arr: SQLArrayContent<BasicParameter>) {
    if (arr.length === 0)
      return "'{}'";
    let result = 'ARRAY[';
    result += Array.isArray(arr[0]) ? this.printArray(arr[0]) : this.print(arr[0]);
    for (let i = 1; i < arr.length; i++) {
      const value = arr[i];
      result += ',' + (Array.isArray(value) ? this.printArray(value) : this.print(value));
    }
    return result + ']';
  }

  print(value: SimpleParameter): string {
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
          return this.print(value.toISOString()) + '::timestamp';
        else if (value instanceof Uint8Array)
          return this.print('\\x' + value.reduce((acc, x) => (acc + (x >> 4).toString(16) + (x & 15).toString(16)), '')) + '::bytea';
        else if (value instanceof SQLArray)
          return this.printArray(value.value);
        else if (value instanceof SQLJson) {
          const json = JSON.stringify(value.value, value.replacer as never)
          if (json === undefined)
            throw new Error('The replacer function passed to a replacer');
          return this.print(json) + '::json';
        }
    }
    throw new Error('Cannot encode type ' + typeof value + ': ' + String(value as undefined));
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
    const result = await this.getSQL().unsafe(sql, parameters.map(p => encodeParameter(this, p) as any));
    return new SQLResponse(
      result,
      result.columns,
      result.count
    );
  }

  async end() {
    if (this.#pg)
      await this.#pg.end();
  }
}

export default function postgresql(pg?: postgresDrv.Sql<any>): SQLDriver<unknown> {
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
