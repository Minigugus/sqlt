import { SimpleParameter } from '../definitions';
import { HELPER_SYMBOL, SQLHelper } from '../helper';
import { SQLBuilder } from '../request';

export /*#__PURE__*/class SQLUpdate<T extends { [key: string]: SimpleParameter | undefined }> extends SQLHelper {
  constructor(
    public readonly updated: T,
    public readonly columns: readonly ((keyof T) & string)[]
  ) {
    super();
    this.updated = updated;
    this.columns = Object.freeze(columns.length === 0 ? this.updated ? Object.keys(this.updated) : [] : columns);
    if (this.columns.length === 0)
      throw new Error('Cannot infer columns names - you should explicitly pass them when calling `values`');
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    let { updated: row, columns } = this;

    if (row.length === 0 || columns.length === 0) // Nothing to insert
      return;

    for (let i = 0, j = 0; i < columns.length; i++) {
      const col = columns[i];
      const value = row[col];
      if (value === undefined)
        continue;
      if (j++)
        builder.addSQL(', ');
      builder.addIdentifier(columns[i]);
      builder.addSQL(' = ');
      builder.renderDynamicParameter(value);
    }
  }
}

/**
 * Create an affectation list that set all columns to their respective values in the provided `rows` object.
 * Can be used after `UPDATE SET` for instance.
 * @param updated An object where keys represents columns' names and their new value.
 * @param columns List of columns to consider in the `rows` object. If none are provided,
 * all enumerable properties from `condition` will be used.
 * @returns An object that can be passed as a sql template string parameter. It will be rendered as
 * a list of *column = value* separed by the `, ` separator.
 */
export /*#__PURE__*/function updates<T extends { [column: string]: SimpleParameter | undefined }>(
  updated: T,
  ...columns: readonly ((keyof T) & string)[]
) {
  return new SQLUpdate(updated, columns);
}
