// @ts-check

// POSTGRESQL-SPECIFIC TESTS

import sqlite3 from 'sqlite3';

// @ts-ignore
import createSql from '../dist/index.mjs';
// @ts-ignore
import { sqlite3 as sqlite3drv } from '../dist/drivers.mjs';
// @ts-ignore
import { manualTest } from './generic.test.mjs';

const sql = createSql(sqlite3drv(new sqlite3.Database(':memory:')), true);

manualTest(sql)
  .then(console.info, console.error)
  .finally(() => sql.end());

// console.log('----');

// (async () => {
//   console.log('00000');
//   await sql`CREATE TABLE IF NOT EXISTS comments (
//     user_id TEXT PRIMARY KEY,
//     user_role TEXT,
//     content TEXT
//   )`;
//   console.log('AAAAA');
//   const req = insert({}, 'test');
//   console.log(req.render());
//   console.log(await req);
//   const req0 = sql`INSERT INTO ${identifier('comments')} ${values([{
//     user_role: 'admin',
//     user_id: 'test',
//     content: 'nothing'
//   }])} ON CONFLICT DO NOTHING`;
//   console.log(req0.renderSQL());
//   console.log(await req0);
//   console.log(await sql`SELECT * FROM comments`);
//   const req1 = sql`SELECT ${[11, sql`${new Uint8Array(1)} AS "."`, array([[json([{ a: 42, b: 1337 }], (k, v) => k !== 'a' ? undefined : v)], [json(["13'3\\7"])]])]} AS arr`;
//   console.log(req1.render());
//   console.log(req1.renderSQL());
//   console.log((await req1).rows[0]);
// })()
//   .finally(() => sql.end())
//   .then(console.info, console.error);
