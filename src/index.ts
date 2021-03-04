import type { Parameter, Row } from './definitions';
import type { SQLDriver } from './driver';

import { SQLDriverControler } from './driver';
import { SQLTemplate } from './request';

export * from './helpers/index'
export * from './file'

export interface SQL {
  <T extends Row>(tsa: TemplateStringsArray, ...parameters: Parameter[]): SQLTemplate<T>;

  end(): Promise<void>;
}

export default function anysql<T extends SQLDriver>(driver: T, raw: boolean = false): SQL {
  if (!driver)
    throw new Error('Missing or invalid required parameter "driver"');

  const controller = new SQLDriverControler(driver);

  function sql<T extends Row>(tsa: TemplateStringsArray, ...parameters: Parameter[]) {
    if (!(tsa && tsa.raw))
      throw new Error('Illegal function call');
    const parts = [...tsa];
    parts[0] = parts[0].trimStart();
    parts[parts.length - 1] = parts[parts.length - 1].trimEnd();
    return new SQLTemplate<T>(controller, raw, parts, parameters);
  }

  async function end() {
    await controller.end();
  }

  sql.end = end;
  return sql;
}
