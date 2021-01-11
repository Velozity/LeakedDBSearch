const resend = require('express').Router();
const database = require('../../config/database');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { sendEmailConfirmation } = require('../../config/mailer');
const logger = require('../../config/winston');

// - resend GET route
resend.get('/', async function (req, res) {
    const { email } = req.query;
    if(email === undefined || !email.includes('@')) {
        res.send('Invalid email');
        return;
    }

    const db = (await database()).session;
    
    // Check confirmation
    const confirmation = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('confirmations')
        .select()
        .where('email = :email')
        .bind('email', email)
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
        res.send('Email not found');
        return;
    }

    let token = uuidv4().substring(0, 6).toUpperCase();
    const updateConfirmation = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('confirmations')
        .update()
        .where('email = :email')
        .set('token', token)
        .set('expires', moment.now() / 1000)
        .bind('email', email)
        .execute()
        .catch((err) => err);

    if(updateConfirmation instanceof Error) {
        db.close();
        logger.error('error' , updateConfirmation)
        res.send('Unable to reset token, try again');
        return;
    }

    sendEmailConfirmation(email, token, email);
    req.flash('registerStatus', { success: true, message: 'Please check your email for a verification code' })
    res.redirect('/register');
});

module.exports = resend;
