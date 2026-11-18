require('dotenv').config();
const { Pool, types } = require('pg');

// BIGINT -> number, DATE -> 'YYYY-MM-DD' string (цагийн бүсийн алдаанаас сэргийлнэ)
types.setTypeParser(20, (v) => parseInt(v, 10));
types.setTypeParser(1082, (v) => v);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
module.exports = pool;
