import type { BasicParameter, PrepapredParameter } from './definitions';

// export const placeholder = (i: number) => '$' + i;
export const placeholder = (i: number) => '?';

export function escape(identifier: string) {
  if (!/[^a-z-A-Z_]/.test(identifier))
    return identifier;
  return '"' + identifier.normalize().replace(/\0/g, '').replace(/"/g, '""') + '"';
}

export function encode(param: BasicParameter): PrepapredParameter {
  if (typeof param === 'object')
    return JSON.stringify(param);
  return param;
}
