import { DynamicParameter } from '../definitions';
import { HELPER_SYMBOL, SQLExpression } from '../helper';
import { SQLBuilder } from '../request';

export /*#__PURE__*/class SQLCall extends SQLExpression {
  public constructor(
    public readonly name: string,
    public readonly parameters: DynamicParameter[]
  ) {
    super();
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    builder.addIdentifier(this.name);
    builder.addSQL('(');
    if (this.parameters.length !== 0) {
      builder.renderDynamicParameter(this.parameters[0]);
      for (let i = 1; i < this.parameters.length; i++) {
        builder.addSQL(', ');
        builder.renderDynamicParameter(this.parameters[i]);
      }
    }
    builder.addSQL(')');
  }
}

/**
 * Represents an SQL function call. The function name and parameters will be escaped.
 * @param name The SQL function name.
 * @param parameters The SQL function call's parameters.
 * @return An object that can be passed as a sql template string parameter.
 */
export /*#__PURE__*/function call(name: string, ...parameters: DynamicParameter[]): SQLCall {
  return new SQLCall(name, parameters);
}
