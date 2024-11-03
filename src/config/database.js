const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

module.exports = {
    connectDB: async () => {
        try {
            await pool.connect();
            console.log('Conexión a la base de datos establecida con éxito');
        } catch (err) {
            console.error('Error al conectar a la base de datos', err);
            throw err;
        }

        return pool;
    },
};