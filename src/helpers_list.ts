import type { BasicParameter, Parameter, PrepapredParameter, SimpleParameter } from './definitions';
import type { HELPER_SYMBOL } from './helpers_def';

import { safe, StaticSQL, isStaticSQL, isHelper, defineHelper, SQLHelper } from './helpers_def';

const COLUMNS_SEPARATOR = safe`, `;

export const column = (columns: string[]) => rest(COLUMNS_SEPARATOR, ...columns.map(identifier));

class SQLJson extends SQLHelper {
  constructor(
    public readonly content: BasicParameter | object
  ) {
    super();
  }
}

export type { SQLJson };

export const json = /*#__PURE__*/defineHelper(SQLJson, function identifier(builder) {
  if (!Object.isFrozen(this.content))
    builder.disableCache();
  builder.addPreparedParameter(this.content);
});

class SQLArray extends SQLHelper {
  constructor(
    public readonly content: BasicParameter[]
  ) {
    super();
  }
}

export type { SQLArray };

export const array = /*#__PURE__*/defineHelper(SQLArray, function identifier(builder) {
  if (!Object.isFrozen(this.content))
    builder.disableCache();
  builder.addPreparedParameter(this.content.map(item => item));
});

export const identifier = /*#__PURE__*/defineHelper(
  class SQLIdentifier extends SQLHelper {
    constructor(
      public readonly name: string
    ) {
      super();
    }
  }, function identifier(builder) {
    if (!builder.driver.escape)
      throw new Error('The underlying driver does not support dynamic SQL identifiers');
    builder.addSQL(builder.driver.escape(this.name));
  }
);

export const rest = /*#__PURE__*/defineHelper(
  class SQLRest extends SQLHelper {
    public readonly separator: string;
    public readonly args: readonly Parameter[];

    constructor(
      separator: StaticSQL,
      ...args: readonly Parameter[]
    ) {
      super();
      this.separator = separator.sql;
      this.args = args;
    }
  }, function rest(builder) {
    if (this.args.length) {
      builder.addParameter(this.args[0]);
      for (let i = 1; i < this.args.length; i++) {
        builder.addSQL(this.separator);
        builder.addParameter(this.args[i]);
      }
    }
  }
);

export const values = /*#__PURE__*/defineHelper(
  class SQLValues<T extends { [key: string]: BasicParameter | object | undefined }> extends SQLHelper {
    public readonly rows: readonly T[];
    public readonly columns: readonly ((keyof T) & string)[]

    constructor(
      rows: T | readonly T[],
      ...columns: readonly ((keyof T) & string)[]
    ) {
      super();
      this.rows = (Array.isArray(rows) ? rows : [rows]) as readonly T[];
      this.columns = Object.freeze(columns.length === 0 ? this.rows[0] ? Object.keys(this.rows[0]) : [] : columns);
      if (this.columns.length === 0)
        throw new Error('Cannot infer columns names - you should explicitly pass them when calling `values`');
    }
  }, function values(builder) {
    let { rows, columns } = this;
    if (!Object.isFrozen(rows))
      builder.disableCache();

    if (!builder.driver.escape)
      throw new Error('The underlying driver does not support dynamic SQL identifiers');
    if (rows.length === 0 || columns.length === 0) // Nothing to insert
      return;

    // Columns
    builder.addSQL('(');
    builder.addSQL(builder.driver.escape(columns[0]));
    for (let i = 1; i < columns.length; i++) {
      builder.addSQL(', ');
      builder.addSQL(builder.driver.escape(columns[i]));
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

    function addRow(row: { [key: string]: BasicParameter | object | undefined }) {
      addValue(row[columns[0]]);
      for (let i = 1; i < columns.length; i++) {
        builder.addSQL(', ');
        addValue(row[columns[i]]);
      }
    }
    function addValue(p: BasicParameter | object | undefined) {
      switch (typeof p) {
        default:
          if (!(isStaticSQL(p) || isHelper(p))) {
            builder.addPreparedParameter(p);
            break;
          }
        case 'undefined':
        case 'function':
        case 'symbol':
          builder.addSQL('DEFAULT');
      }
    }
  }
);

export const updates = /*#__PURE__*/defineHelper(
  class SQLUpdate<T extends { [key: string]: BasicParameter | object | undefined }> extends SQLHelper {
    public readonly row: T;
    public readonly columns: readonly ((keyof T) & string)[]

    constructor(
      row: T,
      ...columns: readonly ((keyof T) & string)[]
    ) {
      super();
      this.row = row;
      this.columns = Object.freeze(columns.length === 0 ? Object.keys(this.row) : columns);
      if (this.columns.length === 0)
        throw new Error('Cannot infer columns names - you should explicitly pass them when calling `updates`');
    }
  }, function updates(builder) {
    let { row, columns } = this;
    if (!Object.isFrozen(row))
      builder.disableCache();

    if (!builder.driver.escape)
      throw new Error('The underlying driver does not support dynamic SQL identifiers');
    if (columns.length === 0) // Nothing to insert
      return;

    for (let i = 0, j = 0; i < columns.length; i++) {
      const c = columns[i];
      const v = row[c];
      switch (typeof v) {
        default:
          if (!(isStaticSQL(v) || isHelper(v))) {
            if (j++ !== 0)
              builder.addSQL(', ');
            builder.addSQL(builder.driver.escape(c));
            builder.addSQL(' = ');
            builder.addPreparedParameter(v);
            break;
          }
        case 'undefined':
        case 'function':
        case 'symbol':
      }
    }
  }
);
