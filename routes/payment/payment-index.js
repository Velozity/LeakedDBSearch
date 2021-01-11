const payment = require('express').Router();

// - purchase
payment.use('/purchase', require('./purchase'));

// - confirm
payment.use('/confirm', require('./confirm'));

// - Create invoice
payment.use('/createinvoice', require('./createinvoice'));

module.exports = payment;
