const jwt = require('jsonwebtoken');

const AUTH_HEADER_PREFIX = 'Bearer ';

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || '';
  if (authHeader.startsWith(AUTH_HEADER_PREFIX)) {
    return authHeader.slice(AUTH_HEADER_PREFIX.length).trim();
  }
  return null;
}

function requireAdminAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({ error: 'Server authentication is not configured' });
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    if (payload?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.admin = payload;
    return next();
  } catch (_) {
    return res.status(401).json({ error: 'Invalid authentication token' });
  }
}

function signAdminToken(csrfToken) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET is required');
  }

  return jwt.sign({ role: 'admin', csrf: csrfToken }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h',
  });
}

module.exports = {
  requireAdminAuth,
  signAdminToken,
};
