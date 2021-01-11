const login = require('express').Router();
const passport = require('../config/passport');

// - login GET route
login.get('/', (req, res) => {
    if(req.user) {
        res.redirect('/search')
        return;
    }
    const loginStatus = req.flash('loginStatus');
    res.render('login', { 
        user: req.user,
        title: 'Login', 
        loginStatus,
        csrfToken: req.csrfToken(),
    });
});

login.post('/', passport.authenticate('login', {
    successRedirect : '/search',
    failureRedirect : '/login',
    failureFlash : true
}));

module.exports = login;
