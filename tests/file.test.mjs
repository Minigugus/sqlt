// @ts-check

// PRINT A .SQL FILE FROM A LIST OF QUERIES (OUTPUTS POSTGRESQL SQL HERE)

// @ts-ignore
import createSql, { renderAsFile, array, json, values, identifier } from '../dist/index.mjs';
// @ts-ignore
import { postgres as postgresql } from '../dist/drivers.mjs';

const sql = createSql(postgresql(), true); // Templating only, works as long as no queries are requested and raw mode is enabled

console.log(
  renderAsFile(
    sql`CREATE TABLE IF NOT EXISTS comments (
      user_id TEXT PRIMARY KEY,
      user_role TEXT,
      content TEXT
    )`,
    sql`INSERT INTO ${identifier('comments')} ${values([{
      user_role: 'admin',
      user_id: 'test',
      content: 'nothing'
    }])} ON CONFLICT DO NOTHING`,
    sql`SELECT * FROM comments`,
    sql`SELECT ${[11, sql`${new Uint8Array(1)} AS "."`, array([[json([{ a: 42, b: 1337 }], ['a'])], [json(["13'3\\7"])]])]} AS arr`
  )
);
