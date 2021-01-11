const cancel = require('express').Router();

// - profile GET route
cancel.get('/', async (req, res) => {
    if(!req.user) {
        res.redirect('/login');
        return;
    }

    res.redirect('/account')
});

module.exports = cancel;
