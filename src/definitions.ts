import type { SQLArray } from './helpers/array';
import type { SQLJson } from './helpers/json';
import type { SQLTemplate } from './request';
import type { SQLHelper } from './helper';

export type BasicParameter = null | boolean | number | string | Date | Uint8Array | SQLJson;

export type SimpleParameter = BasicParameter | SQLArray;

export type Parameter = SimpleParameter | SQLHelper | SQLTemplate | Parameter[];

export interface Notice {
  [field: string]: string;
}

export interface Row {
  [column: string]: any;
}

export interface Column {
  name: string;
}
