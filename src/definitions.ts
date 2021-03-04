import type { SQLTemplate } from './request';
import type {
  SQLDynamicHelper,
  SQLSimpleHelper,
  SQLTemplateHelper,
  SQLValueHelper
} from './helpers/index';

export type BasicParameter = null | boolean | number | bigint | string | Date | Uint8Array | SQLValueHelper;

export type SimpleParameter = BasicParameter | SQLSimpleHelper;

export type DynamicParameter = SimpleParameter | SQLTemplate | SQLDynamicHelper;

export type Parameter = DynamicParameter | SQLTemplateHelper | Parameter[];

export interface Notice {
  [field: string]: string;
}

export interface Row {
  [column: string]: any;
}

export interface Column {
  name: string;
}
