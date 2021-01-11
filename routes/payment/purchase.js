const purchase = require('express').Router();
const moment = require('moment');
const paypal = require('../../config/paypal');
const logger = require('../../config/winston');
const { v4: uuid } = require('uuid');

// - profile GET route
purchase.get('/', async (req, res) => {
    if(!req.user) {
        res.redirect('/login');
        return;
    }

    // Membership types
    // 0 - 30 Days

    let transactionId = uuid().substring(0, 8).toUpperCase();
    paypal.pay(
        'LS' + transactionId, 5, 'LeakedSearch 30 Day Membership', 'USD', false, [req.user.id], (err, url) => {
            if(err) {
                logger.error('payment start error', err)
                req.flash('purchaseStatus', 'Something went wrong, please try again.')
                req.redirect('/profile');
                return;
            }

            res.redirect(url);
        });
});

module.exports = purchase;
