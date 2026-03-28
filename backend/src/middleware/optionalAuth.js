const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

// Parses JWT if present but does not require it
const optionalAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.split(' ')[1], JWT_SECRET);
    } catch { /* ignore invalid tokens */ }
  }
  next();
};

module.exports = optionalAuth;
