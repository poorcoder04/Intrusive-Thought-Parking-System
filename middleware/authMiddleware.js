const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // 2. Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. Attach user payload to the request object (so routes can access req.user)
      req.user = { id: decoded.id };

      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  // If no token is provided at all
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };