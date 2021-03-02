import { SQLBuilder } from '../request';
import { HELPER_SYMBOL, SQLHelper } from '../helper';

export class SQLJson extends SQLHelper {
  public constructor(
    public readonly value: any,
    public readonly replacer: null | (number | string)[]
  ) {
    super();
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    builder.renderSimpleParameter(this);
  }
}

export function json(value: unknown, replacer: null | (number | string)[] = null): SQLJson {
  if (replacer && !Array.isArray(replacer))
    throw new Error('Invalid parameter `replacer`');
  return new SQLJson(value, replacer);
}
