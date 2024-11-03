const { Pool } = require('pg');
const dotenv = require('dotenv');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

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
        hash VARCHAR(255) NOT NULL UNIQUE,
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
    const appName = 'app-buskdos';
    const appHash = crypto.createHash('sha256').update(appName).digest('base64').replace(/[^a-zA-Z0-9]/g, '');
    const concatenatedHash = `${appName}-${appHash}`.toUpperCase();
    console.log('Generated concatenatedHash:', concatenatedHash); // Agregar depuración
    await pool.query(`
      INSERT INTO applications (id, name, hash, active)
      VALUES (1, $1, $2, TRUE)
      ON CONFLICT (id) DO NOTHING;
    `, [appName, concatenatedHash]);

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

const findUserRole = async (userId, applicationHash) => {
  console.log('findUserRole - userId:', userId, 'applicationHash:', applicationHash); // Agregar depuración
  const result = await pool.query(`
    SELECT r.id AS role_id, r.name AS role, ur.application_id, a.hash AS application_hash
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    JOIN applications a ON ur.application_id = a.id
    WHERE ur.user_id = $1 AND a.hash = $2 AND ur.active = TRUE
  `, [userId, applicationHash]);
  console.log('findUserRole result:', result.rows); // Agregar detalles de depuración
  return result.rows.length > 0 ? result.rows[0] : null;
};

const findApplicationByHash = async (hash) => {
  const result = await pool.query('SELECT * FROM applications WHERE hash = $1', [hash]);
  return result.rows[0];
};

const isApplicationActive = async (applicationHash) => {
  const result = await pool.query('SELECT active FROM applications WHERE hash = $1', [applicationHash]);
  return result.rows.length > 0 ? result.rows[0].active : false;
};

const updateUserPassword = async (username, hashedPassword) => {
  const result = await pool.query(
    'UPDATE users SET password = $1 WHERE username = $2 RETURNING *',
    [hashedPassword, username]
  );
  return result.rows[0];
};

const setActiveStatus = async (table, hash, active) => {
  const result = await pool.query(
    `UPDATE ${table} SET active = $1 WHERE hash = $2 RETURNING *`,
    [active, hash]
  );
  return result.rows[0];
};

const createApplication = async (name, hash, active) => {
  const result = await pool.query(
    'INSERT INTO applications (name, hash, active) VALUES ($1, $2, $3) RETURNING *',
    [name, hash, active]
  );
  return result.rows[0];
};

module.exports = {
  createTables,
  findUserByUsernameOrEmail,
  createUser,
  findUserByUsername,
  findUserRole,
  findApplicationByHash,
  isApplicationActive,
  updateUserPassword,
  setActiveStatus,
  createApplication
};
