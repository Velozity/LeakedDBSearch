const account = require('express').Router();
const passport = require('../config/passport');
const redis = require('../config/redis');
const moment = require('moment');
const database = require('../config/database');

// - profile GET route
account.get('/', async (req, res) => {
    if(!req.user) {
        res.redirect('/login');
        return;
    }
    
    const purchaseStatus = req.flash('purchaseStatus');

    const db = (await database()).session;
    const userTransactions = await db
                    .getSchema(process.env.DB_SCHEMA)
                    .getTable('transactions')
                    .select()
                    .where('u_id = :u_id')
                    .bind('u_id', req.user.id)
                    .execute()
                    .then((results) => results.fetchAll())
                    .catch((err) => err);

    db.close();
    if(userTransactions instanceof Error) {
        logger.error('Found user transaction retrieval error', userTransactions);
        return;
    }

    res.render('account', { 
        user: req.user,
        title: 'Account', 
        csrfToken: req.csrfToken(),
        purchaseStatus,
        userTransactions,
        moment,
        daysLeftMembership: req.user.membership === -1 ? 'Infinite' : moment.unix(req.user.membership).diff(moment.now(), 'days')
    });
});

module.exports = account;
