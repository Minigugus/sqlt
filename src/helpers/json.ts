import { SQLBuilder } from '../request';
import { HELPER_SYMBOL, SQLExpression } from '../helper';

export /*#__PURE__*/class SQLJson extends SQLExpression {
  public constructor(
    public readonly value: any
  ) {
    super();
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    builder.renderSimpleParameter(this);
  }
}

/**
 * Represents an SQL json value. If native JSON type isn't supported by the underlying database provider,
 * it will be encoded using another compatible data type (text for instance).
 * @param value The value to encode as JSON.
 * @return An object that can be passed as a sql template string parameter.
 */
export /*#__PURE__*/function json(value: unknown): SQLJson {
  return new SQLJson(value);
}
