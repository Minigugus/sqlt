import { SimpleParameter } from '../definitions';
import { HELPER_SYMBOL, SQLHelper } from '../helper';
import { SQLBuilder } from '../request';

export class SQLValues<T extends { [key: string]: SimpleParameter | undefined }> extends SQLHelper {
  public readonly rows: readonly T[];
  public readonly columns: readonly ((keyof T) & string)[]

  constructor(
    rows: readonly T[],
    columns: readonly ((keyof T) & string)[]
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
    builder.addSQL(builder.identifier(columns[0]));
    for (let i = 1; i < columns.length; i++) {
      builder.addSQL(', ');
      builder.addSQL(builder.identifier(columns[i]));
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

    function addRow(row: { [key: string]: SimpleParameter | undefined }) {
      addValue(row[columns[0]]);
      for (let i = 1; i < columns.length; i++) {
        builder.addSQL(', ');
        addValue(row[columns[i]]);
      }
    }
    function addValue(p: SimpleParameter | undefined) {
      switch (typeof p) {
        default:
          builder.renderSimpleParameter(p);
          break;
        case 'undefined':
          // case 'function':
          // case 'symbol':
          builder.addSQL('DEFAULT');
      }
    }
  }
}

export function values<T extends { [column: string]: SimpleParameter | undefined }>(
  rows: readonly T[],
  ...columns: readonly ((keyof T) & string)[]
) {
  return new SQLValues(rows, columns);
}
