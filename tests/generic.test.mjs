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
  console.time('global test duration');
  console.time('create a "comment" table');

  await sql`CREATE TABLE IF NOT EXISTS comments (
    user_id TEXT PRIMARY KEY,
    user_role TEXT,
    content TEXT
  )`;

  console.timeEnd('create a "comment" table');
  console.time('various parameters encoding');
  const req = insert(sql, {}, 'test');
  console.log(req.render());
  console.log(await req);
  const req0 = sql`INSERT INTO ${identifier('comments')} ${values([{
    user_role: 'admin',
    user_id: sql`SELECT ${'test'}`,
    content: 'nothing'
  }])} ON CONFLICT DO NOTHING`;
  await sql`DELETE FROM comments`;
  console.log(req0.renderSQL());
  console.log(await req0);
  console.log(await sql`SELECT * FROM comments`);
  const req1 = sql`SELECT ${[11, sql`${new Uint8Array(1)} AS "."`, array([[json([{ a: 42 }])], [json(["13'3\\7"])]])]} AS arr`;
  console.log(req1.render());
  console.log(req1.renderSQL());
  // @ts-expect-error FIXME single and multi statements queries
  console.log((await req1).rows[0]);

  console.timeEnd('various parameters encoding');
  console.time('bulk insert (without transaction)');

  for (let i = 0; i < 7; i++)
    await sql`INSERT INTO ${identifier('comments')} ${values([{
      user_role: 'admin',
      user_id: 'test_cursor_' + i,
      content: 'nothing_' + i
      // content: ''
    }])} ON CONFLICT DO NOTHING`;

  console.timeEnd('bulk insert (without transaction)');
  console.time('select with cursor');

  console.log('CURSOR');
  for await (const chunk of await sql`SELECT * FROM comments`.cursor(3))
    console.log('CHUNK', chunk);
  
  console.timeEnd('select with cursor');
  console.time('sql cursor error');

  console.log('CURSOR FAILURE');
  try {
    const req = sql`SELECT wut`.cursor(5);
    const res = await req;
    for await (const chunk of res)
      console.log('CHUNK', chunk);
  } catch (err) {
    console.error(err);
  }

  console.timeEnd('sql cursor error');
  console.timeEnd('global test duration');
}
