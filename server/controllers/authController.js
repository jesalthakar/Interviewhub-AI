const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const BlacklistedToken = require('../models/BlacklistedToken');
const RefreshToken = require('../models/RefreshToken');

const signAccessToken = (user) => {
  const payload = { userId: user._id.toString(), email: user.email };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const signRefreshToken = (user) => {
  const payload = { userId: user._id.toString(), email: user.email };
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
};

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      logger.warn('Register attempt with missing fields');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailLower = String(email).toLowerCase().trim();
    const passwordStr = String(password).trim();

    if (!/^\S+@\S+\.\S+$/.test(emailLower)) {
      logger.warn('Register attempt with invalid email', { email: emailLower });
      return res.status(400).json({ message: 'Invalid email address' });
    }

    if (passwordStr.length < 8) {
      logger.warn('Register attempt with short password', { email: emailLower });
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const existing = await User.findOne({ email: emailLower });
    if (existing) {
      logger.warn('Register attempt for existing user', { email: emailLower });
      return res.status(409).json({ message: 'Email already in use' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(passwordStr, saltRounds);

    const user = new User({ email: emailLower, passwordHash });
    await user.save();

    logger.info('User registered', { id: user._id.toString(), email: user.email });

    return res.status(201).json({ id: user._id, email: user.email });
  } catch (err) {
    logger.error('Register error', err);
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      logger.warn('Login attempt with missing fields');
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailLower = String(email).toLowerCase().trim();
    const passwordStr = String(password).trim();

    const user = await User.findOne({ email: emailLower });
    if (!user) {
      logger.warn('Login failed - user not found', { email: emailLower });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(passwordStr, user.passwordHash);
    if (!isValid) {
      logger.warn('Login failed - invalid password', { email: emailLower });
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const payload = { userId: user._id.toString(), email: user.email };
    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    const decodedRefresh = jwt.decode(refreshToken);
    const refreshExpiresAt = decodedRefresh && decodedRefresh.exp
      ? new Date(decodedRefresh.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await RefreshToken.create({
      token: refreshToken,
      user: user._id,
      expiresAt: refreshExpiresAt,
    });

    logger.info('User logged in', { id: user._id.toString(), email: user.email });

    return res.status(200).json({ token, refreshToken, user: { id: user._id, email: user.email } });
  } catch (err) {
    logger.error('Login error', err);
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      logger.warn('Logout attempt without token');
      return res.status(400).json({ message: 'Authorization token required' });
    }

    // Verify token to read expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // Token invalid or already expired — treat as logged out
      logger.warn('Logout with invalid token');
      return res.status(200).json({ message: 'Logged out' });
    }

    const expiresAt = decoded.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 3600 * 1000);

    // Save to blacklist (ignore duplicates)
    try {
      await BlacklistedToken.create({ token, expiresAt });
    } catch (e) {
      // Duplicate key or other error — log but continue
      logger.warn('Failed to save blacklisted token (may be duplicate)', e.message || e);
    }

    logger.info('User logged out', { user: decoded.userId, email: decoded.email });
    return res.status(200).json({ message: 'Logged out' });
  } catch (err) {
    logger.error('Logout error', err);
    next(err);
  }
};

exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      logger.warn('Refresh token request missing token');
      return res.status(400).json({ message: 'Refresh token required' });
    }

    // Verify refresh token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (err) {
      logger.warn('Invalid refresh token', err.message);
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const stored = await RefreshToken.findOne({ token: refreshToken, user: decoded.userId });
    if (!stored) {
      logger.warn('Refresh token not found or revoked', { userId: decoded.userId });
      return res.status(401).json({ message: 'Refresh token revoked or invalid' });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      logger.warn('Refresh token belongs to deleted user', { userId: decoded.userId });
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    // compute new expiry from token payload
    const decodedNew = jwt.decode(newRefreshToken);
    const newExpiresAt = decodedNew && decodedNew.exp
      ? new Date(decodedNew.exp * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // atomically rotate only if the stored token still matches (prevents replay)
    const updated = await RefreshToken.findOneAndUpdate(
      { _id: stored._id, token: refreshToken },
      { token: newRefreshToken, expiresAt: newExpiresAt, updatedAt: new Date() },
      { new: true }
    );

    if (!updated) {
      logger.warn('Refresh token rotation conflict or already rotated', { userId: user._id.toString() });
      return res.status(401).json({ message: 'Refresh token revoked or invalid' });
    }

    logger.info('Refresh token rotated', { userId: user._id.toString(), email: user.email });
    return res.status(200).json({ token: accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    logger.error('Refresh token error', err);
    next(err);
  }
};
