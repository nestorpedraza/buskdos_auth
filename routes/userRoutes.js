const express = require('express');
const { registerUser, loginUser, changePassword, setActiveStatusController } = require('../controllers/userController');
const authenticateJWT = require('../middlewares/authMiddleware');

const router = express.Router();

// Rutas de usuario
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/change-password', authenticateJWT, changePassword);
router.post('/set-active-status', authenticateJWT, setActiveStatusController);

module.exports = router;
