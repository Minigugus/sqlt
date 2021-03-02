import { SQLBuilder } from '../request';
import { BasicParameter } from '../definitions';
import { HELPER_SYMBOL, SQLHelper } from '../helper';

export type SQLArrayContent<T extends BasicParameter> = SQLArrayContent<T>[] | (T extends boolean ? boolean[] : T extends BasicParameter ? T[] : never);

export class SQLArray<T extends BasicParameter = BasicParameter> extends SQLHelper {
  public constructor(
    public readonly value: SQLArrayContent<T>
  ) {
    super();
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    builder.renderSimpleParameter(this);
  }
}

export function array<T extends BasicParameter>(value: SQLArrayContent<T>): SQLArray<T> {
  return new SQLArray(value);
}
