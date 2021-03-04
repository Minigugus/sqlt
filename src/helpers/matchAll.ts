import { addCondition, Condition, ConditionList } from '../criterias';
import { DynamicParameter } from '../definitions';
import { HELPER_SYMBOL, SQLHelper } from '../helper';
import { SQLBuilder } from '../request';

export /*#__PURE__*/class SQLMatchAll<T extends ConditionList> extends SQLHelper {
  public constructor(
    public readonly row: T,
    public readonly columns: readonly ((keyof T) & string)[]
  ) {
    super();
    this.row = row;
    this.columns = Object.freeze(columns.length === 0 ? this.row ? Object.keys(this.row) : [] : columns);
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    const { row, columns } = this;
    const conditions = columns.reduce((acc, c) => {
      const value = row[c];
      if (value !== undefined)
        acc.push([c, value]);
      return acc;
    }, [] as Condition[]);
    if (conditions.length === 0)
      builder.addSQL('1 = 1');
    else {
      addCondition(builder, conditions[0]);
      for (let i = 1; i < conditions.length; i++) {
        builder.addSQL(' AND ');
        addCondition(builder, conditions[i]);
      }
    }
  }
}

/**
 * Create a condition list that matches only when all keys' values matches equivalent columns' values.
 * Can be used as a `WHERE` condition for instance.
 * @param condition An object where keys represents columns' names and theirs expected values in SQL.
 * @param columns List of columns to consider in the `condition` object. If none are provided,
 * all enumerable properties from `condition` will be used.
 * @returns An object that can be passed as a sql template string parameter. It will be rendered as
 * a list of *is equal to* conditions separed by the `AND` keyword.
 */
export /*#__PURE__*/function matchAll<T extends ConditionList>(condition: T, ...columns: readonly ((keyof T) & string)[]): SQLMatchAll<T> {
  return new SQLMatchAll(condition, columns);
}
