// server/middleware/authenticateToken.js
import jwt from 'jsonwebtoken';

function authenticateToken(req, res, next) {
  // Get token from Authorization header (format: "Bearer TOKEN")
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Get token part after "Bearer "

  if (token == null) {
    // If no token, return 401 Unauthorized
    console.log('Auth Middleware: No token provided.');
    return res.status(401).json({ message: 'Access token is required.' });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // If token is invalid (expired, wrong signature, etc), return 403 Forbidden
      console.log('Auth Middleware: Token invalid.', err.message);
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    // If token is valid, the decoded payload is in 'user'
    // Attach the user payload to the request object
    req.user = user;
    console.log('Auth Middleware: Token valid for user:', user.username);

    // Call next() to pass control to the next middleware or route handler
    next();
  });
}

export default authenticateToken;