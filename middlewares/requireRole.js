module.exports = function (requiredRole) {
  return function (req, res, next) {
    if (!req.user || !req.user.roles || !req.user.roles.includes(requiredRole)) {
      // Return 403 Forbidden or redirect
      // For this app, redirect to home if not admin
      return res.redirect('/');
    }
    next();
  };
};
