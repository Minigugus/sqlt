import { SQLCursor } from '../cursor';
import { BasicParameter, Row, SimpleParameter } from '../definitions';
import { encodeParameter, SQLDriver, SQLDriverControler } from '../driver';
import { SQLHelper } from '../helper';
import { SQLArrayContent } from '../helpers/array';
import { SQLBuilder } from '../request';
import { SQLResponse } from '../response';

const noop = <T>(i: T) => i;

export class NullDriver implements SQLDriver {
  null(): unknown { return null }
  boolean(v: boolean): unknown { return v; }
  number(v: number): unknown { return v; }
  bigint(v: bigint): unknown { return v; }
  string(v: string): unknown { return v; }
  date(v: Date): unknown { return v; }
  buffer(v: Uint8Array): unknown { return v; }
  array(v: SQLArrayContent<BasicParameter>): unknown { return v; }
  json(v: any, replacer: null | (number | string)[]): unknown {
    if (replacer)
      v = replaceWithIncludedProps(v, replacer);
    return v;
  }

  print(value: SimpleParameter): string {
    return JSON.stringify(encodeParameter(this, value));
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

const CIRCULAR = new WeakSet();

function replaceWithIncludedProps(v: any, props: (number | string)[]) {
  if (typeof v === 'object' && v) {
    if (
      v instanceof Date ||
      v instanceof Uint8Array ||
      v instanceof SQLHelper ||
      CIRCULAR.has(v)
    )
      return v;
    CIRCULAR.add(v);
    try {
      if (Array.isArray(v)) {
        const p = new Set(props);
        const arr: any[] = [];
        for (let i = 0; i < v.length; i++)
          if (p.has(i) || p.has(String(i)))
            arr.push(replaceWithIncludedProps(v, props));
        return arr;
      } else {
        const res: { [key: string]: any } = {};
        for (const k in v)
          if (k in v && v[k] !== undefined)
            res[k] = replaceWithIncludedProps(v, props);
        return res;
      }
    } finally {
      CIRCULAR.delete(v);
    }
  }
  return v;
}

// function replaceWithReplacer(v: any, replacer: (this: any, key: string, value: any) => any) {
//   if (typeof v === 'object' && v) {
//     if (
//       v instanceof Date ||
//       v instanceof Uint8Array ||
//       v instanceof SQLHelper ||
//       CIRCULAR.has(v)
//     )
//       return v;
//     CIRCULAR.add(v);
//     try {
//       if (Array.isArray(v)) {
//         const arr: any[] = [];
//         for (let i = 0; i < v.length; i++) {
//           const value = replacer.call(v, String(i), v[i]);
//           if (value !== undefined)
//             arr.push(replaceWithReplacer(value, replacer));
//         }
//         return arr;
//       } else {
//         const res: { [key: string]: any } = {};
//         for (const k in v) {
//           const value = replacer.call(v, k, v[k]);
//           if (value !== undefined)
//             res[k] = replaceWithReplacer(value, replacer);
//         }
//         return res;
//       }
//     } finally {
//       CIRCULAR.delete(v);
//     }
//   }
//   return v;
// }
