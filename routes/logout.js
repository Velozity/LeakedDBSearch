const logout = require('express').Router();

// - Logout GET route
logout.get('/', (req, res) => {
  req.logout();
  res.redirect('/login');
})

module.exports = logout;
