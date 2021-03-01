import type { SQLBuilder } from './request';

import { NonTaggedTemplateCallError } from './errors';

let SAFE_CONSTRUCTOR_CALL = false;

const SAFE_INSTANCES = new WeakSet<object>();

const HELPER_SYMBOL = Symbol();

export type { HELPER_SYMBOL };

export class SQLHelper {
  public readonly [HELPER_SYMBOL]: (builder: SQLBuilder) => void;

  protected constructor() {
    if (!SAFE_CONSTRUCTOR_CALL)
      throw new Error('Illegal constructor call');
    SAFE_INSTANCES.add(this);
  }
}

Object.freeze(SQLHelper.prototype);

export function isHelper(x: any): x is SQLHelper {
  return x instanceof SQLHelper && SAFE_INSTANCES.has(x);
}

export function invokeHelper(helper: SQLHelper, builder: SQLBuilder) {
  return helper[HELPER_SYMBOL].call(helper, builder);
}

export function defineHelper<T extends any[], U extends SQLHelper>(ctor: (new (...args: T) => U) & { prototype: U }, action: (this: U, builder: SQLBuilder) => void) {
  Object.defineProperty(ctor.prototype, HELPER_SYMBOL, {
    configurable: false,
    enumerable: false,
    writable: false,
    value: action
  });
  Object.freeze(ctor.prototype);
  return (...args: T) => {
    try {
      SAFE_CONSTRUCTOR_CALL = true;
      return Object.freeze(new ctor(...args)) as U;
    } finally {
      SAFE_CONSTRUCTOR_CALL = false;
    }
  };
}

export type { StaticSQL };

class StaticSQL {
  public constructor(
    readonly sql: string
  ) {
    if (!SAFE_CONSTRUCTOR_CALL)
      throw new Error('Illegal constructor call');
    SAFE_INSTANCES.add(this);
    Object.freeze(this);
  }

  valueOf() {
    return this.sql;
  }

  toString() {
    return this.sql;
  }
}

Object.freeze(StaticSQL.prototype);

export function isStaticSQL(x: any): x is StaticSQL {
  return x instanceof StaticSQL && SAFE_INSTANCES.has(x);
}

export function expectStaticSQL(x: any): asserts x is StaticSQL {
  if (!isStaticSQL(x))
    throw new Error('A valid static SQL string is expected');
}

export function safe(tsa: TemplateStringsArray) {
  if (!Array.isArray(tsa.raw))
    throw new NonTaggedTemplateCallError();
  if (arguments.length > 1)
    throw new Error('This tagged template string cannot contain parameters');
  try {
    SAFE_CONSTRUCTOR_CALL = true;
    return new StaticSQL(tsa[0]);
  } finally {
    SAFE_CONSTRUCTOR_CALL = false;
  }
}
