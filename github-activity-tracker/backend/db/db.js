const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.RDS_HOST,
  port: Number(process.env.RDS_PORT) || 5432,
  database: process.env.RDS_DATABASE,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
});

module.exports = pool;
