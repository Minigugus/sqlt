// @ts-check

// POSTGRESQL-SPECIFIC TESTS

// @ts-ignore
import initSqlJsPromise from './sqljs.mjs';

// @ts-ignore
import createSql from '../dist/index.mjs';
// @ts-ignore
import { sqljs } from '../dist/drivers.mjs';
// @ts-ignore
import { manualTest } from './generic.test.mjs';

initSqlJsPromise
  .then(({ Database }) => {
    const sql = createSql(sqljs(new Database(null)), false);

    return manualTest(sql)
      .then(console.info, console.error)
      .finally(() => sql.end())
  });
