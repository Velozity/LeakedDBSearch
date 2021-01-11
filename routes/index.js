const index = require('express').Router();

// - Home
index.use('/', require('./home'));

// - Register
index.use('/register', require('./register'));

// - Login
index.use('/login', require('./login'));

// - Register
index.use('/logout', require('./logout'));

// - Search
index.use('/search', require('./search'));

// - Search
index.use('/stats', require('./stats'));

// - Account
index.use('/account', require('./account'));

// - Forget Pass
index.use('/forgot', require('./forgot'));

// - Admin
index.use('/admin', require('./admin'));

// - Payment
index.use('/payment', require('./payment/payment-index'));

// - Auth
index.use('/auth', require('./auth/auth-index'));

module.exports = index;
