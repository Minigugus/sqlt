import type sqljs from 'sql.js';

import { SQLDriver, unencodable } from '../driver';

import { SQLMultiStatementResponse, SQLResponse } from '../response';
import { BasicParameter, Row, SimpleParameter } from '../definitions';
import { SQLArray, SQLArrayContent } from '../helpers/array';
import { SQLJson } from '../helpers/json';
import { SQLBuilder } from '../request';
import { SQLSyncCursor } from '../cursor';

type Database = InstanceType<(ReturnType<typeof sqljs> extends Promise<infer R> ? R : never)['Database']>;

function wrap({ columns, values }: ReturnType<Database['exec']>[number]) {
  return new SQLResponse(
    values.map(v => v.reduce((obj, vv, i) => (obj[columns[i]] = vv, obj), {} as Row)),
    columns.map(name => ({ name })),
    values.length
  );
}

class SQLJSDriver implements SQLDriver {
  #db: Database | null;

  public constructor(
    db: Database | null
  ) {
    this.#db = db;
  }

  private getSQL() {
    if (this.#db === null)
      throw new Error('Template mode only - pass an instance of an sql-wasm `Database` class to enter full mode');
    return this.#db;
  }

  private cleanArray(v: BasicParameter | SQLArrayContent<BasicParameter>): any {
    while (v instanceof SQLArray)
      v = v.value;
    if (Array.isArray(v))
      return v.map((x: any) => this.cleanArray(x));
    if (v instanceof SQLJson)
      return v.value;
    return this.prepare(v);
  }

  prepare(value: SimpleParameter) {
    switch (typeof value) {
      case 'bigint':
        value = String(value);
      case 'boolean':
      case 'number':
      case 'string':
        return value;
      case 'object':
        if (value === null)
          return null;
        else if (value instanceof Date)
          return value;
        else if (value instanceof Uint8Array)
          return value;
        else if (value instanceof SQLArray)
          return JSON.stringify(this.cleanArray(value.value));
        else if (value instanceof SQLJson)
          return JSON.stringify(value.value);
    }
    unencodable(value);
  }

  serialize(value: SimpleParameter): string {
    switch (typeof value) {
      case 'boolean':
        return value ? '0' : '1';
      case 'number':
      case 'bigint':
        return String(value);
      case 'string':
        return `'${value.replace(/'/g, "''")}'`;
      case 'object':
        if (value === null)
          return 'NULL';
        else if (value instanceof Date)
          return this.serialize(value.getTime());
        else if (value instanceof Uint8Array)
          return 'X' + this.serialize(value.reduce((acc, x) => (acc + (x >> 4).toString(16) + (x & 15).toString(16)), ''));
        else if (value instanceof SQLArray)
          return this.serialize(JSON.stringify(this.cleanArray(value.value)));
        else if (value instanceof SQLJson)
          return this.serialize(JSON.stringify(value.value));
    }
    unencodable(value);
  }

  identifier(name: string) {
    return /[^a-z_]/.test(name) ? `"${name.replace(/\0/g, '').replace(/"/g, '""')}"` : name;
  }

  encode(builder: SQLBuilder, value: SimpleParameter, index: number) {
    builder.addSimpleParameter('?', value);
  }

  async query(sql: string, parameters: SimpleParameter[]): Promise<SQLResponse | SQLMultiStatementResponse> {
    const db = this.getSQL();
    // @ts-ignore
    const result = db.exec(sql, parameters.map(p => this.prepare(p)));
    switch (result.length) {
      case 0:
        return new SQLResponse([], [], 0);
      case 1:
        return wrap(result[0]);
    }
    return result.map(wrap);
  }

  async cursor(size: number, sql: string, parameters: SimpleParameter[]): Promise<SQLSyncCursor> {
    const db = this.getSQL();
    // @ts-ignore
    const result = db.exec(sql, parameters.map(p => this.prepare(p)));
    if (result.length > 1)
      throw new Error("Cursor doesn't work with multi-statement queries");
    const { columns, values } = result[0];
    return new SQLSyncCursor(
      () => (function* sqlite3cursor(size: number, rows: any[]) {
        for (let i = 0; i < rows.length; i += size)
          yield rows.slice(i, i + size);
      })(size, values.map(v => v.reduce((obj, vv, i) => (obj[columns[i]] = vv, obj), {} as Row))),
      columns.map(name => ({ name })),
      values.length
    );
  }

  async end() {
    const db = this.getSQL();
    db.close();
  }
}

export default function sqjs(db: Database): SQLJSDriver {
  return new SQLJSDriver(db);
}
