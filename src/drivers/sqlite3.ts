import type sqlite3drv from 'sqlite3';

import { encodeParameter } from '../driver';

import { NullDriver } from './null';

import { SQLResponse } from '../response';
import { BasicParameter, Row, SimpleParameter } from '../definitions';
import { SQLArray, SQLArrayContent } from '../helpers/array';
import { SQLJson } from '../helpers/json';

class SQLite3Driver extends NullDriver {
  #db: sqlite3drv.Database;

  public constructor(
    db: sqlite3drv.Database
  ) {
    super();
    this.#db = db;
  }

  private cleanArray(v: BasicParameter | SQLArrayContent<BasicParameter>): any {
    while (v instanceof SQLArray)
      v = v.value;
    if (Array.isArray(v))
      return v.map((x: any) => this.cleanArray(x));
    if (v instanceof SQLJson)
      return super.json(v.value, v.replacer);
    return encodeParameter(this, v);
  }

  bigint(v: bigint) {
    return String(v);
  }

  array(v: SQLArrayContent<BasicParameter>) {
    return JSON.stringify(this.cleanArray(v));
  }

  json(v: any, replacer: null | (number | string)[]) {
    return JSON.stringify(v, replacer);
  }

  print(value: SimpleParameter): string {
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
          return this.print(value.getTime());
        else if (value instanceof Uint8Array)
          return 'X' + this.print(value.reduce((acc, x) => (acc + (x >> 4).toString(16) + (x & 15).toString(16)), ''));
        else if (value instanceof SQLArray)
          return this.print(this.array(value.value));
        else if (value instanceof SQLJson)
          return this.print(JSON.stringify(value.value, value.replacer as never));
    }
    throw new Error('Cannot encode type ' + typeof value + ': ' + String(value as undefined));
  }

  identifier(name: string) {
    return /[^a-z_]/.test(name) ? `"${name.replace(/\0/g, '').replace(/"/g, '""')}"` : name;
  }

  async query(sql: string, parameters: SimpleParameter[]): Promise<SQLResponse> {
    const db = this.#db;
    return new SQLResponse(
      await new Promise<Row[]>((res, rej) =>
        db.all(sql, parameters.map(p => encodeParameter(this, p) as any), (err, row) => err ? rej(err) : res(row))
      )
    );
  }

  async end() {
    const db = this.#db;
    return new Promise<void>((res, rej) => db.close(err => err ? rej(err) : res()))
  }
}

export default function sqlite3(db: sqlite3drv.Database): SQLite3Driver {
  return new SQLite3Driver(db);
}
