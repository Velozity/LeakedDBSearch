const createinvoice = require('express').Router();
const moment = require('moment');
const logger = require('../../config/winston');
const { v4: uuid } = require('uuid');
require('../../config/coinbase');
const coinbase = require('coinbase-commerce-node');
const charge = coinbase.resources.Charge;
const redis = require('../../config/redis');
const { sendPaymentConfirmation } = require('../../config/mailer');

// - profile GET route
createinvoice.get('/', async (req, res) => {
    if(!req.user) {
        res.redirect('/login');
        return;
    }

    // Membership types
    // 0 - 30 Days

    const transactionId = 'LS' + uuid().substring(0, 8).toUpperCase();
    const chargeData = {
        'name': 'LeakedSearch Membership',
        'description': '30 days full access membership to LeakedSearch',
        'local_price': {
            'amount': '5.00',
            'currency': 'USD'
        },
        'pricing_type': 'fixed_price'
    }

    charge.create(chargeData, function (error, response) {
      if(error) {
          req.flash('flashMsg', 'An error occured setting up the invoice')
          res.redirect('/account')
          return;
      }
      // Store in redis
      redis.setAsync(`cointransaction_${response.code}`, JSON.stringify({
          t_id: transactionId,
          u_id: req.user.id,
          code: response.code
      }), 'EX', 12*3600);

      res.redirect(response.hosted_url);
    });
});

module.exports = createinvoice;
