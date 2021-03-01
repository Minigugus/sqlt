import type { StaticSQL, SQLHelper } from './helpers_def';
import type { SQLJson } from './helpers_list';
import type { SQLRequest } from './index';

export type PrepapredParameter = object | BasicParameter | PrepapredParameter[];

export type BasicParameter = null | boolean | number | bigint | string | Date | Uint8Array | SQLJson | BasicParameter[];

export type SimpleParameter = BasicParameter | SQLRequest | StaticSQL | SQLHelper | SimpleParameter[];

export type Parameter = SimpleParameter | (() => SimpleParameter);

export interface SQLDriver {
  escape?(str: string): string;
  placeholder(index: number): string;
  encode?(param: PrepapredParameter, index: number): PrepapredParameter;
}

export const DEFAULT_DRIVER: SQLDriver = {
  placeholder: () => '?'
};
