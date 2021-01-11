const confirm = require('express').Router();
const database = require('../../config/database');
const moment = require('moment');

// - Confirm GET route
confirm.get('/', async function (req, res) {
    const { token } = req.query;

    if(token === undefined || token.length !== 6) {
        res.send('Invalid token');
        return;
    }

    const db = (await database()).session;
    
    // Check confirmation
    const confirmation = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('confirmations')
        .select()
        .where('token = :token')
        .bind('token', token)
        .execute()
        .then((result) => result.fetchOne())
        .catch((err) => err);

    if(confirmation instanceof Error) {
        db.close();
        res.send('Cannot connect to servers')
        return;
    }

    if(confirmation === undefined || confirmation.length === 0) {
        db.close();
        res.send('Token expired or invalid');
        return;
    }

    if(!moment.unix(confirmation[3]).add(48, 'hours').isSameOrAfter(moment.now())) {
        db.close();
        req.flash('loginStatus', { resend: true, message: 'Token expired, click Resend Email Verification.', email: confirmation[2] })
        res.redirect('/login')
        return;
    }

    db.startTransaction();

    // Set user to confirmed 
    const setConfirm = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('users')
        .update()
        .where('email = :email')
        .set('emailverified', 1)
        .bind('email', confirmation[2])
        .execute()
        .then((results) => results.getAffectedItemsCount())
        .catch((err) => err);

    if (setConfirm instanceof Error || setConfirm === 0) {
        db.rollback();
        db.close();
        return;
    }

    // Delete confirmation
    const deleteConfirm = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('confirmations')
        .delete()
        .where('token = :token')
        .bind('token', token)
        .execute()
        .catch((err) => err);

    if(deleteConfirm === undefined || deleteConfirm.length === 0) {
        db.rollback();
        db.close();
        return;
    }

    db.commit();
    db.close();

    req.flash('loginStatus', 'You may login now!')
    res.redirect('/login')
});

// - Confirm POST route
confirm.post('/', async function (req, res) {
    const { token } = req.body;
    if(token.length !== 6) {
        res.status(200).json({ error: 'Bad request' });
        return;
    }

    const db = (await database()).session;

    // Check confirmation
    const confirmation = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('confirmations')
        .select()
        .where('token = :token AND expires < :now')
        .bind('token', token)
        .bind('now', moment.now())
        .execute()
        .then((result) => result.fetchOne())
        .catch((err) => err);

    if(confirmation instanceof Error) {
        db.close();
        res.status(200).json({ error: 'Cannot connect to servers' })
        return;
    }

    if(confirmation === undefined || confirmation.length === 0) {
        db.close();
        res.status(200).json({ error: 'Invalid token' })
        return;
    }

    db.startTransaction();

    // Set user to confirmed 
    const setConfirm = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('users')
        .update()
        .where('email = :email')
        .set('emailverified', 1)
        .bind('email', confirmation[2])
        .execute()
        .then((results) => results.getAffectedItemsCount())
        .catch((err) => err);

    if (setConfirm instanceof Error || setConfirm === 0) {
        db.rollback();
        db.close();
        res.status(200).json({ error: 'Cannot connect to server' })
        return;
    }

    // Delete confirmation
    const deleteConfirm = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('confirmations')
        .delete()
        .where('token = :token')
        .bind('token', token)
        .execute()
        .catch((err) => err);

    if(deleteConfirm instanceof Error) {
        db.rollback();
        db.close();
        res.status(200).json({ error: 'Cannot connect to server' });
        return;
    }

    db.commit();
    db.close();

    res.status(200).json({ error: null, message: 'Email verified' });
});

module.exports = confirm;
