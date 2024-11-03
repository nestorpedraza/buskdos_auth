const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const loginRouter = require('./routes/login');
const applicationsRouter = require('./routes/applications'); // Asegúrate de que este archivo exista y esté correctamente configurado

// Configurar bodyParser para manejar solicitudes JSON
app.use(bodyParser.json());

// Registrar las rutas
app.use('/api/login', loginRouter);
app.use('/api/applications', applicationsRouter); // Registrar la ruta de applications

// Manejar errores 404
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Manejar errores del servidor
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
