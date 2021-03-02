// @ts-check

// A GENERIC THAT SHOULD SUCCEED FOR ANY SUPPORTED PROVIDER (SQLITE3 AND POSTGRESQL AS OF NOW)

// @ts-ignore
import { array, json, values, identifier } from '../dist/index.mjs';

// From https://github.com/porsager/postgres/issues/156#issuecomment-788230327
const authed = (sql, id) => sql`
  user_id = ${id} or user_role = 'admin'
`

// From https://github.com/porsager/postgres/issues/156#issuecomment-788230327
const insert = (sql, data, id) => sql`
  update comments set
    content = ''
  where ${authed(sql, id)} 
`;

/**
 * 
 * @param {import('../dist/index').SQL} sql 
 */
export async function manualTest(sql) {
  await sql`CREATE TABLE IF NOT EXISTS comments (
    user_id TEXT PRIMARY KEY,
    user_role TEXT,
    content TEXT
  )`;
  console.log('AAAAA');
  const req = insert(sql, {}, 'test');
  console.log(req.render());
  console.log(await req);
  const req0 = sql`INSERT INTO ${identifier('comments')} ${values([{
    user_role: 'admin',
    user_id: 'test',
    content: 'nothing'
  }])} ON CONFLICT DO NOTHING`;
  console.log(req0.renderSQL());
  console.log(await req0);
  console.log(await sql`SELECT * FROM comments`);
  const req1 = sql`SELECT ${[11, sql`${new Uint8Array(1)} AS "."`, array([[json([{ a: 42, b: 1337 }], ['a'])], [json(["13'3\\7"])]])]} AS arr`;
  console.log(req1.render());
  console.log(req1.renderSQL());
  console.log((await req1).rows[0]);
}