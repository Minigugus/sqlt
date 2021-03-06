import type sqlite3drv from 'sqlite3';

import { SQLDriver, unencodable } from '../driver';

import { SQLResponse } from '../response';
import { BasicParameter, Row, SimpleParameter } from '../definitions';
import { SQLArray, SQLArrayContent } from '../helpers/array';
import { SQLJson } from '../helpers/json';
import { SQLBuilder } from '../request';
import { SQLAsyncCursor, SQLSyncCursor } from '../cursor';

class SQLite3Driver implements SQLDriver {
  #db: sqlite3drv.Database | null;

  public constructor(
    db: sqlite3drv.Database | null
  ) {
    this.#db = db;
  }

  private getSQL() {
    if (this.#db === null)
      throw new Error('Template mode only - pass an instance of an SQLite3 `Database` class to enter full mode');
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
          return value instanceof Buffer ? value : Buffer.from(value);
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

  async query(sql: string, parameters: SimpleParameter[]): Promise<SQLResponse> {
    const db = this.getSQL();
    return new SQLResponse(
      await new Promise<Row[]>((res, rej) =>
        db.all(sql, parameters.map(p => this.prepare(p)), (err, row) => err ? rej(err) : res(row))
      )
    );
  }

  async cursor(size: number, sql: string, parameters: SimpleParameter[]): Promise<SQLSyncCursor> {
    const db = this.getSQL();
    const rows = await new Promise<Row[]>((res, rej) =>
      db.all(sql, parameters.map(p => this.prepare(p)), (err, row) => err ? rej(err) : res(row))
    );
    return new SQLSyncCursor(
      () => (function *sqlite3cursor(size: number, rows: any[]) {
        for (let i = 0; i < rows.length; i += size)
          yield rows.slice(i, i + size);
      })(size, rows),
      Object.keys(rows[0]).map(name => ({ name })),
      rows.length
    );
  }

  async end() {
    const db = this.getSQL();
    return new Promise<void>((res, rej) => db.close(err => err ? rej(err) : res()))
  }
}

export default function sqlite3(db: sqlite3drv.Database): SQLite3Driver {
  return new SQLite3Driver(db);
}
