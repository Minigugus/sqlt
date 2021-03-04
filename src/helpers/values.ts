import { DynamicParameter } from '../definitions';
import { HELPER_SYMBOL, SQLHelper } from '../helper';
import { SQLBuilder } from '../request';

export /*#__PURE__*/class SQLValues<T extends { [key: string]: DynamicParameter | undefined }> extends SQLHelper {
  constructor(
    public readonly rows: readonly T[],
    public readonly columns: readonly ((keyof T) & string)[]
    ) {
    super();
    this.rows = rows;
    this.columns = Object.freeze(columns.length === 0 ? this.rows[0] ? Object.keys(this.rows[0]) : [] : columns);
    if (this.columns.length === 0)
      throw new Error('Cannot infer columns names - you should explicitly pass them when calling `values`');
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    let { rows, columns } = this;

    if (rows.length === 0 || columns.length === 0) // Nothing to insert
      return;

    // Columns
    builder.addSQL('(');
    builder.addIdentifier(columns[0]);
    for (let i = 1; i < columns.length; i++) {
      builder.addSQL(', ');
      builder.addIdentifier(columns[i]);
    }
    builder.addSQL(') ');

    // Rows
    builder.addSQL('VALUES (');
    addRow(rows[0]);
    for (let i = 1; i < rows.length; i++) {
      builder.addSQL('), (');
      addRow(rows[i]);
    }
    builder.addSQL(')');

    function addRow(row: { [key: string]: DynamicParameter | undefined }) {
      addValue(row[columns[0]]);
      for (let i = 1; i < columns.length; i++) {
        builder.addSQL(', ');
        addValue(row[columns[i]]);
      }
    }
    function addValue(p: DynamicParameter | undefined) {
      builder.renderDynamicParameter(p);
    }
  }
}

/**
 * Create an `INSERT INTO` columns and values list to insert supplied `rows`.
 * @param rows The list of rows to insert.
 * @param columns List of columns to insert. If none are provided,
 * all enumerable properties from the first row will be used.
 * @returns An object that can be passed as a sql template string parameter. It will be rendered as
 * the list of columns, followed by the `VALUES` keyword, followed by all `rows` in the values format.
 */
export /*#__PURE__*/function values<T extends { [column: string]: DynamicParameter | undefined }>(
  rows: readonly T[],
  ...columns: readonly ((keyof T) & string)[]
) {
  return new SQLValues(rows, columns);
}
