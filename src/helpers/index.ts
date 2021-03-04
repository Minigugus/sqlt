import type { SQLArray } from './array';
import type { SQLJson } from './json';
import type { SQLIdentifier } from './identifier';
import type { SQLUpdate } from './updates';
import type { SQLValues } from './values';
import type { SQLMatchAll } from './matchAll';
import type { SQLCall } from './call';

export { json } from './json';
export type SQLValueHelper = never
  | SQLJson;

export { array } from './array';
export type SQLSimpleHelper = SQLValueHelper
  | SQLArray;

export { call } from './call';
export { identifier } from './identifier';
export type SQLDynamicHelper = SQLSimpleHelper
  | SQLCall
  | SQLIdentifier;

export { values } from './values';
export { updates } from './updates';
export { matchAll } from './matchAll';
export type SQLTemplateHelper = SQLDynamicHelper
  | SQLUpdate<any>
  | SQLValues<any>
  | SQLMatchAll<any>;
