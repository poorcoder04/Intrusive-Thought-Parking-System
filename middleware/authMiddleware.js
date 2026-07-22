const jwt = require('jsonwebtoken');

// Fix #2 & #6: Removed async (no await used), added return guards to prevent
// double-response crash when a bad/missing token is provided.
const protect = (req, res, next) => {
  // Check for token in the Authorization header
  if (
    !req.headers.authorization ||
    !req.headers.authorization.startsWith('Bearer')
  ) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  const token = req.headers.authorization.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed or expired' });
  }
};

module.exports = { protect };
