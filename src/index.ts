import type { Parameter, SQLDriver } from './definitions';
import type { SQLRequest } from './request';

export type { SQLDriver, SQLTemplate, SQLRequest };

// import { DEFAULT_DRIVER } from './definitions';
import { SQLTemplate } from './request';
import { NonTaggedTemplateCallError } from './errors';

export { safe } from './helpers_def';

export * as errors from './errors';
export * from './helpers_list';

// export const sql = createSql(DEFAULT_DRIVER);

export function createSql(driver: SQLDriver) {
  return function sql(sql: TemplateStringsArray, ...parameters: Parameter[]) {
    if (!Array.isArray(sql.raw))
      throw new NonTaggedTemplateCallError();
    return new SQLTemplate(driver, sql.raw, parameters).render();
  }
}
