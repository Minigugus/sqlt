import { HELPER_SYMBOL, SQLHelper } from '../helper';
import { SQLBuilder } from '../request';

export class SQLIdentifier extends SQLHelper {
  public constructor(
    public readonly name: string
  ) {
    super();
  }

  public [HELPER_SYMBOL](builder: SQLBuilder): void {
    builder.addSQL(builder.identifier(this.name));
  }
}

export function identifier(name: string): SQLIdentifier {
  return new SQLIdentifier(name);
}
