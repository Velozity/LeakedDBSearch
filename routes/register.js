const register = require('express').Router();
const passport = require('../config/passport');

// - register GET route
register.get('/', (req, res) => {
    if(req.user) {
        res.redirect('/search');
        return;
    }

    const registerStatus = req.flash('registerStatus');
    res.render('register', { 
        user: req.user,
        title: 'Register', 
        registerStatus,
        csrfToken: req.csrfToken(),
    });
});

register.post('/', function(req, res, next) {
    if(req.user) {
      res.redirect('/search');
      return;
    }
    
    passport.authenticate('register', function(err, user, info) {
      if (err) { return next(err); }
      console.log(info);
      return res.redirect('/register');
    })(req, res, next);
});

module.exports = register;
