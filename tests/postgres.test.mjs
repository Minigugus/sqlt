// @ts-check

// POSTGRESQL-SPECIFIC TESTS

import postgres from 'postgres';

// @ts-ignore
import createSql from '../dist/index.mjs';
// @ts-ignore
import { postgres as postgresql } from '../dist/drivers.mjs';
// @ts-ignore
import { manualTest } from './generic.test.mjs';

const sql = createSql(postgresql(postgres()), false);

manualTest(sql)
  .then(console.info, console.error)
  .finally(() => sql.end());

// (async () => {
//   await sql`CREATE TABLE IF NOT EXISTS comments (
//     user_id TEXT PRIMARY KEY,
//     user_role TEXT,
//     content TEXT
//   )`;
//   const req = insert({}, 'test');
//   console.log(req.render());
//   console.log(await req);
//   // console.log(await sql`INSERT INTO comments VALUES (${'test'}, ${'admin'}, ${'nothing'}) ON CONFLICT DO NOTHING RETURNING user_id`);
//   const req0 = sql`INSERT INTO ${identifier('comments')} ${values([{
//     user_role: 'admin',
//     user_id: 'test',
//     content: 'nothing'
//   }])} ON CONFLICT DO NOTHING RETURNING user_id`;
//   console.log(req0.renderSQL());
//   console.log(await req0);
//   console.log(await sql`SELECT * FROM comments`);
//   const req1 = sql`SELECT ${[11, sql`${new Uint8Array(1)} AS "."`, array([[json([{ a: 42, b: 1337 }], ['a'])], [json(["13'3\\7"])]])]} AS arr`;
//   console.log(req1.render());
//   console.log(req1.renderSQL());
//   console.log((await req1).rows[0]);
// })().then(console.info, console.error)
//   .finally(() => sql.end());
