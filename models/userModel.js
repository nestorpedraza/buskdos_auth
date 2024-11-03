const { Pool } = require('pg');
const dotenv = require('dotenv');

// Configurar dotenv para cargar variables de entorno
dotenv.config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createUserTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      );
    `);
    console.log('Tabla "users" verificada o creada exitosamente.');
  } catch (err) {
    console.error('Error al crear la tabla "users":', err);
  }
};

const findUserByUsernameOrEmail = async (username, email) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $2', [username, email]);
  return result.rows;
};

const createUser = async (username, email, hashedPassword) => {
  const result = await pool.query(
    'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
    [username, email, hashedPassword]
  );
  return result.rows[0];
};

const findUserByUsername = async (username) => {
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
};

module.exports = {
  createUserTable,
  findUserByUsernameOrEmail,
  createUser,
  findUserByUsername
};
