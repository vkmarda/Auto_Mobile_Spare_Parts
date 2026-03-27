const { Pool } = require('pg');
const { DATABASE_URL } = require('./env');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.query('SELECT 1')
  .then(() => console.log('Database connected'))
  .catch((err) => console.error('Database connection failed:', err.message));

const query = (text, params) => pool.query(text, params);

module.exports = { query };
