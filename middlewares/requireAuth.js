const jwt = require('jsonwebtoken');
const config = require('config');

// In this simple implementation, we're simulating auth via cookie
// If there's a real JWT, we'd verify it here
module.exports = function (req, res, next) {
  // For now, we simulate user from role cookie
  const role = req.cookies.role || 'client';

  const userId = '507f1f77bcf86cd799439011';

  // Ensure user exists in DB for this simulated session
  const User = require('../models/User');
  User.findById(userId).then(user => {
    if (!user) {
      User.create({
        _id: userId,
        name: 'Simulated User',
        email: 'user@example.com',
        password: 'password123',
        roles: ['customer']
      }).catch(err => console.error('Simulated user creation failed:', err));
    }
  });

  // Simulate a req.user object
  req.user = {
    _id: userId,
    roles: [role]
  };

  // In a real app with JWT:
  // const token = req.cookies.token || req.header('x-auth-token');
  // if (!token) return res.status(401).send('Access denied. No token provided.');
  // try {
  //   const decoded = jwt.verify(token, config.get('jwtPrivateKey'));
  //   req.user = decoded;
  //   next();
  // } catch (ex) {
  //   res.status(400).send('Invalid token.');
  // }

  next();
};
