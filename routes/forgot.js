const forgot = require('express').Router();
const passport = require('../config/passport');
const database = require('../config/database');
const moment = require('moment');
const { sendPassResetConfirmation } = require('../config/mailer');
const { v4: uuidv4 } = require('uuid');
const redis = require('../config/redis');

// - forgot GET route
forgot.get('/', async (req, res) => {
  const {
    token
  } = req.query;

  if(token !== undefined) {
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

    db.close();
    if(confirmation instanceof Error) {
      res.render('forgot', { 
          user: req.user,
          title: 'Forget Password', 
          flashMsg: ['An error occured'],
          token: null,
      });
      return;
    }

    if(confirmation === undefined || confirmation.length === 0) {
        res.render('forgot', { 
            user: req.user,
            title: 'Forget Password', 
            token: null,
            flashMsg: ['Token expired or is invalid'],
        });
        return;
    }

    const flashMsg = req.flash('flashMsg');
    res.render('forgot', { 
      user: req.user,
      title: 'Forget Password', 
      flashMsg,
      token,
    });
    return;
  }

  const flashMsg = req.flash('flashMsg');

  res.render('forgot', { 
      user: req.user,
      title: 'Forget Password', 
      flashMsg,
      token: null,
      csrfToken: req.csrfToken(),
  });
});

forgot.post('/', async (req, res) => {
  const {
    email
  } = req.body;

    const db = (await database()).session;

    const user = await db
    .getSchema(process.env.DB_SCHEMA)
    .getTable('users')
    .select()
    .where('email = :email')
    .bind('email', req.body.email)
    .execute()
    .then((result) => result.fetchOne())
    .catch((err) => err);

    if(user instanceof Error) {
      db.close();
      logger.error('Found error', user);
      req.flash('flashMsg', 'An error occured');
      res.redirect('/forgot')
      return;
    }

    if(user === undefined || user.length === 0) {
        db.close();
        req.flash('flashMsg', 'No user with that email exists');
        res.redirect('/forgot')
        return;
    }

    // Spam prevention
    let hitCount = await redis.getAsync(`spamprotect_reset_${req.clientIp}`);
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
    await redis.setAsync(`spamprotect_reset_${req.clientIp}`, JSON.stringify(hitCount));
    console.log(`(reset) Rate limit for ${req.clientIp}: ${hitCount.length}`)

      // Insert confirmation
      // type 1 = pass\
      let token = uuidv4().substring(0, 6).toUpperCase();
      const createConfirmation = await db
      .getSchema(process.env.DB_SCHEMA)
      .getTable('confirmations')
      .insert(['token', 'type', 'email', 'expires'])
      .values(token, 1, req.body.email, moment(moment.now()).add(12, 'hours').unix())
      .execute()
      .catch((err) => err);

      if(createConfirmation instanceof Error) {
          db.close();
          logger.error('Found error', createConfirmation);
          req.flash('flashMsg', 'An error occured');
          res.redirect('/forgot')
          return;
      }

    sendPassResetConfirmation(req.body.email, token, user[1]);
    req.flash('flashMsg', 'An email has been sent to ' + req.body.email);
    res.redirect('/forgot')
});

module.exports = forgot;
