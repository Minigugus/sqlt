import { SQLBuilder } from './request';

export const HELPER_SYMBOL = Symbol();

export /*#__PURE__*/abstract class SQLHelper {
  public abstract [HELPER_SYMBOL](builder: SQLBuilder): void;
}

export /*#__PURE__*/abstract class SQLExpression extends SQLHelper {
}

export /*#__PURE__*/function invokeHelper(builder: SQLBuilder, helper: SQLHelper) {
  helper[HELPER_SYMBOL].call(helper, builder);
}
