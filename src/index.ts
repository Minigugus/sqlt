import type { Parameter, Row } from './definitions';
import type { SQLDriver } from './driver';

import { SQLDriverControler } from './driver';
// import type { JSToPostgresTypeMap, Options } from './options';
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
    return new SQLTemplate<T>(controller, raw, tsa, parameters);
  }

  async function end() {
    await controller.end();
  }

  sql.end = end;
  return sql;
}
