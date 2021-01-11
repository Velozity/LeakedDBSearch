const admin = require('express').Router();
const passport = require('../config/passport');
const database = require('../config/database');
const moment = require('moment');

// - admin GET route
const admins = [
  'Velozity',
  'xorist'
];
admin.get('/', async (req, res) => {
    if(!req.user) {
        res.redirect('/login');
        return;
    }

    if(!admins.includes(req.user.username)) {
      res.status(404);
      return;
    }

    const flashMsg = req.flash('flashMsg');

    const db = (await database()).session;
    const users = await db
      .getSchema(process.env.DB_SCHEMA)
      .getTable('users')
      .select()
      .execute()
      .then((results) => results.fetchAll())
      .catch((err) => err);

    if(users instanceof Error) {
        logger.error('Found users retrieval error', transactions);
        return;
    }

    const transactions = await db
      .getSchema(process.env.DB_SCHEMA)
      .getTable('transactions')
      .select()
      .execute()
      .then((results) => results.fetchAll())
      .catch((err) => err);

    db.close();
    if(transactions instanceof Error) {
        logger.error('Found transactions retrieval error', transactions);
        return;
    }

    res.render('admin', { 
        user: req.user,
        title: 'Admin', 
        flashMsg,
        moment,
        transactions,
        users,
        csrfToken: req.csrfToken(),
    });
});

module.exports = admin;
