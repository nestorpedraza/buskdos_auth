const crypto = require('crypto'); // Importar el módulo crypto para generar el hash
const { connectDB } = require('../config/database'); // Importar la función connectDB

async function saveApplication(applicationData) {
    const pool = await connectDB(); // Conectar a la base de datos
    const { name, active } = applicationData; // Ajusta según los campos de tu aplicación
    const hash = (name + '-' + crypto.randomBytes(16).toString('hex')).toUpperCase(); // Generar el hash con un guion y convertir a mayúsculas

    // Verificar si el nombre ya existe
    const checkQuery = 'SELECT COUNT(*) FROM applications WHERE name = $1';
    const checkValues = [name];
    const { rows } = await pool.query(checkQuery, checkValues);
    if (parseInt(rows[0].count) > 0) {
        return { error: `El nombre ${name} ya existe en la base de datos` };
    }

    const query = 'INSERT INTO applications (name, hash, active) VALUES ($1, $2, $3)';
    const values = [name, hash, active];
    console.log(hash); // Agregar depuración

    try {
        await pool.query(query, values);
        return { message: 'Aplicación guardada correctamente' };
    } catch (error) {
        console.error('Error al ejecutar la consulta:', error);
        throw new Error('Error al guardar la aplicación en la base de datos');
    }
}

module.exports = {
    saveApplication,
};
