// @ts-check

// PRINT A .SQL FILE FROM A LIST OF QUERIES (OUTPUTS POSTGRESQL SQL HERE)

// @ts-ignore
import createSql, { renderAsFile, array, json, values, identifier } from '../dist/index.mjs';
// @ts-ignore
import { sqlite3 } from '../dist/drivers.mjs';

const sql = createSql(sqlite3(), true); // Templating only, works as long as no queries are requested and raw mode is enabled

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

console.log(
  renderAsFile(
    sql`CREATE TABLE IF NOT EXISTS comments (
      user_id TEXT PRIMARY KEY,
      user_role TEXT,
      content TEXT
    )`,
    sql`INSERT INTO ${identifier('comments')} ${values([{
      user_role: 'admin',
      user_id: sql`SELECT ${'test'}`,
      content: 'nothing'
    }])} ON CONFLICT DO NOTHING`,
    sql`SELECT * FROM comments`,
    sql`SELECT ${[11, sql`${new Uint8Array(1)} AS "."`, array([[json([{ a: 42 }])], [json(["13'3\\7"])]])]} AS arr`,
    insert(sql, {}, 'test')
  )
);
