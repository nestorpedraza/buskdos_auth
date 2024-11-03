const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { createApplication } = require('../models/userModel');

// Definir la ruta POST para /api/applications
router.post('/', async (req, res) => {
  const { name, active } = req.body;
console.log('Request - name:', name, 'active:', active); // Agregar depuración
  if (!name) {
    return res.status(400).json({ status: 400, error: 'Se requiere el nombre de la aplicación' });
  }

  try {
    const appHash = crypto.createHash('sha256').update(name).digest('base64').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const application = await createApplication(name, appHash, active);
    res.status(201).json(application);
  } catch (err) {
    console.error('Error al crear la aplicación:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;
