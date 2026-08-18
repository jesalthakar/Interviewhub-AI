const jwt = require('jsonwebtoken');
const BlacklistedToken = require('../models/BlacklistedToken');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';
    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication token required' });
    }

    const isBlacklisted = await BlacklistedToken.exists({ token });
    if (isBlacklisted) {
      return res.status(401).json({ message: 'Authentication token has been revoked' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid or expired authentication token' });
    }

    logger.error('Authentication middleware error', error);
    next(error);
  }
};

module.exports = authenticate;
