const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    console.log('Auth Middleware: No token found, authorization denied');
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    console.log('Auth Middleware: Token valid, user:', req.user);
    next();
  } catch (err) {
    console.log('Auth Middleware: Token is not valid', err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
