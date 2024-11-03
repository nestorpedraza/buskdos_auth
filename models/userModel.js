const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');

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

const createTables = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    // Insertar roles por defecto
    await pool.query(`
      INSERT INTO roles (name, active)
      VALUES
        ('Super Administrador', TRUE),
        ('Administrador', TRUE),
        ('Usuario', TRUE)
      ON CONFLICT (name) DO NOTHING;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        application_id INTEGER REFERENCES applications(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_applications (
        user_id INTEGER REFERENCES users(id),
        application_id INTEGER REFERENCES applications(id),
        PRIMARY KEY (user_id, application_id)
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER REFERENCES users(id),
        role_id INTEGER REFERENCES roles(id),
        application_id INTEGER REFERENCES applications(id),
        active BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (user_id, role_id, application_id)
      );
    `);

    // Insertar usuarios por defecto con IDs específicos
    const hashedPassword = await bcrypt.hash('S3cur3P@ssw0rd!', 10);

    await pool.query(`
      INSERT INTO users (id, username, email, password, active)
      VALUES (1, 'superadmin', 'superadmin@example.com', $1, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `, [hashedPassword]);

    await pool.query(`
      INSERT INTO users (id, username, email, password, active)
      VALUES (2, 'admin', 'admin@example.com', $1, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `, [hashedPassword]);

    await pool.query(`
      INSERT INTO users (id, username, email, password, active)
      VALUES (3, 'user', 'user@example.com', $1, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `, [hashedPassword]);

    // Insertar aplicación por defecto
    await pool.query(`
      INSERT INTO applications (id, name, active)
      VALUES (1, 'app-buskados', TRUE)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Asignar roles a los usuarios por defecto
    const superAdminRoleId = await pool.query(`SELECT id FROM roles WHERE name = 'Super Administrador'`);
    const adminRoleId = await pool.query(`SELECT id FROM roles WHERE name = 'Administrador'`);
    const userRoleId = await pool.query(`SELECT id FROM roles WHERE name = 'Usuario'`);

    // Asignar todos los roles a superadmin y establecer uno como activo
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id, application_id, active)
      VALUES (1, $1, 1, TRUE), (1, $2, 1, FALSE), (1, $3, 1, FALSE)
      ON CONFLICT DO NOTHING;
    `, [superAdminRoleId.rows[0].id, adminRoleId.rows[0].id, userRoleId.rows[0].id]);

    // Asignar roles de admin y user a admin y establecer uno como activo
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id, application_id, active)
      VALUES (2, $1, 1, TRUE), (2, $2, 1, FALSE)
      ON CONFLICT DO NOTHING;
    `, [adminRoleId.rows[0].id, userRoleId.rows[0].id]);

    // Asignar rol de user a user y establecerlo como activo
    await pool.query(`
      INSERT INTO user_roles (user_id, role_id, application_id, active)
      VALUES (3, $1, 1, TRUE)
      ON CONFLICT DO NOTHING;
    `, [userRoleId.rows[0].id]);

    console.log('Tablas verificadas o creadas exitosamente.');
  } catch (err) {
    console.error('Error al crear las tablas:', err);
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

const findUserRole = async (userId) => {
  const result = await pool.query(`
    SELECT r.name AS role
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = $1 AND ur.active = TRUE
  `, [userId]);
  console.log('findUserRole result:', result.rows); // Agregar detalles de depuración
  return result.rows.length > 0 ? result.rows[0].role : null;
};

const updateUserPassword = async (username, hashedPassword) => {
  const result = await pool.query(
    'UPDATE users SET password = $1 WHERE username = $2 RETURNING *',
    [hashedPassword, username]
  );
  return result.rows[0];
};

const setActiveStatus = async (table, id, active) => {
  const result = await pool.query(
    `UPDATE ${table} SET active = $1 WHERE id = $2 RETURNING *`,
    [active, id]
  );
  return result.rows[0];
};

module.exports = {
  createTables,
  findUserByUsernameOrEmail,
  createUser,
  findUserByUsername,
  findUserRole,
  updateUserPassword,
  setActiveStatus
};
