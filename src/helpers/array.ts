import { SQLBuilder } from '../request';
import { BasicParameter } from '../definitions';
import { HELPER_SYMBOL, SQLExpression } from '../helper';

export type SQLArrayContent<T extends BasicParameter> = SQLArrayContent<T>[] | (T extends boolean ? boolean[] : T extends BasicParameter ? T[] : never);

export /*#__PURE__*/class SQLArray<T extends BasicParameter = BasicParameter> extends SQLExpression {
  public constructor(
    public readonly value: SQLArrayContent<T>
  ) {
    super();
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    builder.renderSimpleParameter(this);
  }
}

/**
 * Represents an SQL array. If array type isn't supported by the underlying database provider,
 * it will be encoded using another compatible data type (text for instance).
 * @param value The array to encode. The array mustn't mix items types.
 * @return An object that can be passed as a sql template string parameter.
 */
export /*#__PURE__*/function array<T extends BasicParameter>(value: SQLArrayContent<T>): SQLArray<T> {
  return new SQLArray(value);
}
