// poolManager.js
import { Pool } from 'pg';

const poolCache = {};

const getPoolForDB = (dbName) => {
  if (poolCache[dbName]) return poolCache[dbName];

  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'secret',
    database: dbName,
  });

  poolCache[dbName] = pool;
  return pool;
}

export default getPoolForDB
