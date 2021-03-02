import { SQLBuilder } from './request';

export const HELPER_SYMBOL = Symbol();

export abstract class SQLHelper {
  public abstract [HELPER_SYMBOL](builder: SQLBuilder): void;
}

export function invokeHelper(builder: SQLBuilder, helper: SQLHelper) {
  helper[HELPER_SYMBOL].call(helper, builder);
}
