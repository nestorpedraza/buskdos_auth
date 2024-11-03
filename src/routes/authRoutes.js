module.exports = (app) => {
    const AuthController = require('../controllers/authController');

    app.post('/api/register', AuthController.register);
    app.post('/api/login', AuthController.login);
};