# SQLt - SQL template without a backend

SQLt is a proof-of-concept API for *building reusable safe SQL queries* easily, using
the powerfull ES6 tagged template string feature to ensure SQL safety.

## Examples

More in [postgres.test.mjs](./tests/postgres.test.mjs)

```ts
import { createSql, values, identifier } from 'sqlt';
import * as sqlite3 from 'sqlt/dist/sqlite3';
import * as postgres from 'sqlt/dist/postgres';

const sqlite = createSql(sqlite);
const postgresql = createSql(postgres);

const getAllUsers = postgresql`SELECT * FROM users`;

console.log(getAllUsers)
// => [ 'SELECT * FROM users', [] ]

const getUsersRegisteredSinceStartup = postgresql`${getAllUsers} WHERE created_at >= ${Date.now()}`;

console.log(getUsersRegisteredSinceStartup)
// => [ 'SELECT * FROM users WHERE created_at >= $0', [1614613323274] ]

const insertUser = (user: { nam3: string, admin: boolean, created_at?: number }) =>
  postgresql`INSERT INTO ${identifier(user.admin ? 'admins' : 'users')} ${values(user, 'nam3', 'created_at')}`;

console.log(insertUser({ nam3: 'John', admin: true, created_at: Date.now() }));
// => [ 'INSERT INTO admins ("nam3", created_at) VALUES ($0, $1)', ['John', 1614613323275] ]
console.log(insertUser({ nam3: 'Robert', admin: false }));
// => [ 'INSERT INTO users ("nam3", created_at) VALUES ($0, DEFAULT)', ['Robert'] ]

const registerHeartbeat = postgresql`INSERT INTO events (kind, date) VALUES ('heartbeat', ${() => Date.now()})`;

console.log(registerHeartbeat);
// => [ 'INSERT INTO events (kind, date) VALUES ('heartbeat', $0)', [1614613323277] ]
```
