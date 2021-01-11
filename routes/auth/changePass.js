const changePass = require('express').Router();
const database = require('../../config/database');
const moment = require('moment');
const bcrypt = require('bcrypt');
const redis = require('../../config/redis');

// - changePass GET route
changePass.post('/', async function (req, res) {
    const { 
        password, 
        token 
    } = req.body;

    if(password.length < 6) {
        req.flash('flashMsg', 'Password must be atleast 6 characters');
        res.redirect('/forgot?token=' + token)
        return;
    }

    if(token === undefined || token.length !== 6) {
        res.send('Invalid token');
        return;
    }

    // Spam prevention
    let hitCount = await redis.getAsync(`spamprotect_reset2_${req.clientIp}`);
    if (hitCount === null)
        hitCount = [];
    else 
        hitCount = JSON.parse(hitCount)
    
    
    hitCount = hitCount.filter((unix) => moment.unix(unix / 1000).add(1, 'hour').isSameOrAfter(moment.now()) && unix !== null)
    
    if(hitCount.length > 3) {
        console.log(`Rate limit for ${req.clientIp} REACHED: ${hitCount.length}`)
        req.flash('flashMsg', 'Please try again in an hour');
        res.redirect('/forgot')
        return;
    }
    
    hitCount.push(moment.now())
    await redis.setAsync(`spamprotect_reset2_${req.clientIp}`, JSON.stringify(hitCount));
    console.log(`(reset 2) Rate limit for ${req.clientIp}: ${hitCount.length}`)

    const db = (await database()).session;
    
    // Check confirmation
    const confirmation = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('confirmations')
        .select()
        .where('token = :token AND type=1 AND expires < :now')
        .bind('token', token)
        .bind('now', moment.now())
        .execute()
        .then((result) => result.fetchOne())
        .catch((err) => err);

    if(confirmation instanceof Error) {
        db.close();
        req.flash('flashMsg', 'Something went wrong');
        res.redirect('/forgot?token=' + token)
        return;
    }

    if(confirmation === undefined || confirmation.length === 0) {
        db.close();
        res.send('Token expired or invalid');
        return;
    }

    db.startTransaction();

    // Set new pass
    bcrypt.hash(password, 10, async function(err, hash) { 
        if(err) {
            db.close();
            logger.error('Found error', err);
            req.flash('flashMsg', 'An error occured');
            res.redirect('/forgot');
        }

        const setNewPass = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('users')
        .update()
        .where('email = :email')
        .set('password', hash)
        .bind('email', confirmation[2])
        .execute()
        .then((results) => results.getAffectedItemsCount())
        .catch((err) => err);

        if (setNewPass instanceof Error || setNewPass === 0) {
            db.rollback();
            db.close();
            req.flash('flashMsg', 'An error occured');
            res.redirect('/forgot');
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
            req.flash('flashMsg', 'An error occured');
            res.redirect('/forgot');
            return;
        }

        db.commit();
        db.close();

        req.flash('loginStatus', 'Your password has been reset!')
        res.redirect('/login')
    });
});

module.exports = changePass;
