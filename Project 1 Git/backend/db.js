import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  user: 'postgres',
  password: 'Password',
  host: 'localhost',
  port: 5432,
  database: 'dirty_soda_shop'
});

client.connect()
  .then(() => console.log('Connected'))
  .catch(err => console.error(err));
