const deleteAccount = require('express').Router();
const database = require('../../config/database');

// - deleteAccount GET route
deleteAccount.post('/', async function (req, res) {
    if(!req.user) {
        res.redirect('/login');
        return;
    }

    const db = (await database()).session;
    
    // Set account to close
    const setClose = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('users')
        .update()
        .set('closed', 1)
        .where('id = :id')
        .bind('id', req.user.id)
        .execute()
        .then((result) => result.getAffectedItemsCount())
        .catch((err) => err);

    db.close();
    if(setClose instanceof Error || setClose === undefined || setClose === 0) {
        req.flash('flashMsg', 'Something went wrong');
        res.redirect('/account')
        return;
    }

    res.redirect('/logout');
});

module.exports = deleteAccount;
