const express = require('express');
const dotenv = require('dotenv');
const next = require('next');
const { createTables } = require('../models/userModel');
const userRoutes = require('../routes/userRoutes');
const { saveApplication } = require('./models/applicationModel'); // Asegúrate de que la ruta sea correcta

// Configurar dotenv para cargar variables de entorno
dotenv.config();

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = process.env.PORT || 3000;

app.prepare().then(async () => {
    const server = express();

    // Inicializar la base de datos
    await createTables();

    // Middleware para analizar el cuerpo de las solicitudes
    server.use(express.json());

    // Usar las rutas de usuario
    server.use('/api', userRoutes);

    // Definir la ruta /api/applications
    server.post('/api/applications', async (req, res) => {
        try {
            const applicationData = req.body;
            const result = await saveApplication(applicationData); // Guardar los datos en la base de datos
            if (result.error) {
                return res.status(400).send({ message: result.error });
            }
            res.status(201).send({ message: result.message });
        } catch (error) {
            console.error('Error al guardar la aplicación:', error);
            res.status(500).send({ message: 'Error al guardar la aplicación' });
        }
    });

    // Manejar las rutas de Next.js
    server.all('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(PORT, (err) => {
        if (err) throw err;
        console.log(`> Listo en http://localhost:${PORT}`);
    });
});