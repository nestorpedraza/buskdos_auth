const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ status: 401, error: 'Acceso denegado. Por favor, inicie sesión.' });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(401).json({ status: 401, error: 'Token inválido o expirado. Por favor, inicie sesión nuevamente.' });
  }
};

module.exports = authenticateJWT;
