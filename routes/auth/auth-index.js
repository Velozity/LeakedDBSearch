const auth = require('express').Router();

// - Confirm
auth.use('/confirm', require('./confirm'));

// - Resend
auth.use('/resend', require('./resend'));

// - changePass
auth.use('/changePass', require('./changePass'));

// - deleteAccount
auth.use('/deleteAccount', require('./deleteAccount'));


module.exports = auth;
