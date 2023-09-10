// Connect to PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

// create and export query to be used in database.js
const query = (text, params, callback) => {
  return pool.query(text, params, callback);
};

module.exports = { query };