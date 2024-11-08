const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByUsernameOrEmail, createUser, findUserByUsername, findUserRole, isApplicationActive, updateUserPassword, setActiveStatus } = require('../models/userModel');

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ status: 400, error: 'Se requieren nombre de usuario, correo electrónico y contraseña' });
  }

  try {
    // Verificar si el nombre de usuario o el correo electrónico ya existen
    const userExists = await findUserByUsernameOrEmail(username, email);
    if (userExists.length > 0) {
      return res.status(400).json({ status: 400, error: 'El nombre de usuario o el correo electrónico ya existen' });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos
    const newUser = await createUser(username, email, hashedPassword);

    // Crear un token JWT
    const token = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });

    res.status(201).json({ status: 201, token, username: newUser.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, error: 'Error en el registro del usuario' });
  }
};

const loginUser = async (req, res) => {
  const { username, password, applicationHash } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 400, error: 'Se requieren nombre de usuario y contraseña' });
  }
  if (!applicationHash) {
    return res.status(400).json({ status: 400, error: 'Se requiere ID de la aplicación' });
  }

  try {
    // Verificar si el usuario existe
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(400).json({ status: 400, error: 'Nombre de usuario o contraseña incorrectos' });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ status: 400, error: 'Nombre de usuario o contraseña incorrectos' });
    }

    // Verificar si la aplicación está activa
    const isActive = await isApplicationActive(applicationHash);
    if (!isActive) {
      return res.status(400).json({ status: 400, error: 'La aplicación no está activa' });
    }

    // Obtener el rol activo del usuario para la aplicación
    const roleData = await findUserRole(user.id, applicationHash);
    console.log('User role:', roleData); // Agregar detalles de depuración

    // Crear un token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION,
    });

    res.status(200).json({ 
      status: 200, 
      token, 
      username: user.username, 
      role_id: roleData.role_id, 
      role: roleData.role, 
      application_id: roleData.applicationHash
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, error: 'Error en el inicio de sesión' });
  }
};

const changePassword = async (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  if (!username || !oldPassword || !newPassword) {
    return res.status(400).json({ status: 400, error: 'Se requieren nombre de usuario, contraseña antigua y contraseña nueva' });
  }

  try {
    // Verificar si el usuario existe
    const user = await findUserByUsername(username);
    if (!user) {
      return res.status(400).json({ status: 400, error: 'Nombre de usuario incorrecto' });
    }

    // Verificar la contraseña antigua
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ status: 400, error: 'Contraseña antigua incorrecta' });
    }

    // Encriptar la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar la contraseña en la base de datos
    await updateUserPassword(username, hashedPassword);

    res.status(200).json({ status: 200, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, error: 'Error al actualizar la contraseña' });
  }
};

const setActiveStatusController = async (req, res) => {
  const { table, id, active } = req.body;
  if (!table || !id || active === undefined) {
    return res.status(400).json({ status: 400, error: 'Se requieren tabla, id y estado activo' });
  }

  try {
    const updatedRecord = await setActiveStatus(table, id, active);
    res.status(200).json({ status: 200, message: 'Estado actualizado correctamente', data: updatedRecord });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, error: 'Error al actualizar el estado' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  changePassword,
  setActiveStatusController
};
