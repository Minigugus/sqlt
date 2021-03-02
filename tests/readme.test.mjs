// Inspired by https://github.com/porsager/postgres/issues/156#issuecomment-788230327

import createSql, { renderAsFile } from '../dist/index.mjs';
import postgresql from '../dist/postgres.mjs';

const sql = createSql(postgresql());

const authed = id => sql`
  user_id = ${id} or user_role = 'admin'
`

const insert = (data, id) => sql`
  update comments set
    content = ''
  where ${authed(id)} 
`;

console.log(renderAsFile(insert('something', 'john')));

//  -- Generated by SQLt / Tue, 02 Mar 2021 19:37:04 GMT / Node v14.15.1
//
//  update comments set
//    content = ''
//  where
//  user_id = 'john' or user_role = 'admin';