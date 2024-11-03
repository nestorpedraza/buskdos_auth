const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByUsername, findUserRole, findApplicationByHash, isApplicationActive } = require('../models/userModel');

// ...código existente...

router.post('/api/login', async (req, res) => {
  const { username, password, applicationHash } = req.body;
  console.log('Login request - username:', username, 'applicationHash:', applicationHash); // Agregar depuración

  if (!applicationHash) {
    return res.status(400).json({ status: 400, error: 'Se requiere hash de la aplicación' });
  }

  try {
    const application = await findApplicationByHash(applicationHash);
    if (!application) {
      return res.status(400).json({ status: 400, error: 'El hash de la aplicación no existe' });
    }

    const isActive = await isApplicationActive(applicationHash);
    if (!isActive) {
      return res.status(400).json({ status: 400, error: 'La aplicación no está activa' });
    }

    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const userRole = await findUserRole(user.id, applicationHash);
    if (!userRole) {
      return res.status(401).json({ message: 'Rol de usuario no encontrado para esta aplicación' });
    }

    const token = jwt.sign({ userId: user.id, role: userRole.role, applicationHash }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error('Error en /api/login:', err);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// ...código existente...

module.exports = router;
