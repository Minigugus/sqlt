import { createSql, values, column, identifier, updates, array, json } from '../dist/index.esm.mjs';
import * as postgresFormat from '../dist/postgres.mjs';

const sql = createSql(postgresFormat);

let req = sql`
  select name, age from users
`;

console.log(req);

req = sql`
  insert into users (
    name, age
  ) values (
    'Murray', 68
  )

  returning *
`;

console.log(req);

let search = 'Mur';

req = sql`
  select 
    name, 
    age 
  from users
  where 
    name like ${ search + '%' }
`;

console.log(req);

req = sql`
  select 
    * 
  from users
  where age in (${ [68, 75, 23] })
`;

console.log(req);

const user = {
  name: 'Murray',
  age: 68
}

req = sql`
  insert into users ${
    values(user, 'name', 'age')
  }
`

console.log(req);

const users = [{
  name: 'Murray',
  age: 68,
  garbage: 'ignore'
}, {
  name: 'Walter'
}]

req = sql`
  insert into users ${
    values(users, 'name', 'age')
  }
`;

console.log(req);

const muray = {
  id: 1,
  name: 'Muray'
}

req = sql`
  update users set ${
    updates(muray, 'name')
  } where 
    id = ${ muray.id }
`

console.log(req);

const columns = ['name', 'age']

req = sql`
  select ${
    column(columns)
  } from users
`

console.log(req);

const table = 'users'

req = sql`
  select id from ${identifier(table)}
`

console.log(req);

req = sql`
insert into types (
  integers,
  strings,
  dates,
  buffers,
  multi
) values (
  ${ array([1,2,3,4,5]) },
  ${ array(['Hello', 'Postgres']) },
  ${ array([new Date(), new Date(), new Date()]) },
  ${ array([Buffer.from('Hello'), Buffer.from('Postgres')]) },
  ${ array([[[1,2],[3,4]],[[5,6],[7,8]]]) },
)
`;

console.log(req);

const body = { hello: 'postgres' }

req = sql`
insert into json (
  body
) values (
  ${ json(body) }
)
returning body
`

console.log(req);
