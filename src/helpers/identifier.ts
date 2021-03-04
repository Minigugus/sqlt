import { HELPER_SYMBOL, SQLExpression } from '../helper';
import { SQLBuilder } from '../request';

export /*#__PURE__*/class SQLIdentifier extends SQLExpression {
  public constructor(
    public readonly name: string
  ) {
    super();
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    builder.addIdentifier(this.name);
  }
}

/**
 * Represents an SQL identifier. It will be escaped according to the underlying driver's rules.
 * @param name The SQL identifier name. Can be a table or column name for instance.
 * @return An object that can be passed as a sql template string parameter.
 */
export /*#__PURE__*/function identifier(name: string): SQLIdentifier {
  return new SQLIdentifier(name);
}
