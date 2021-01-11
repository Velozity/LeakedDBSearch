const passport = module.exports = require('passport');
const { sendEmailConfirmation } = require('./mailer');
const database = require('./database');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const nodemailer = require("nodemailer");
const logger = require('./winston');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const redis = require('./redis');

// Passport Login
passport.use('login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true,
  },
    async function(req, username, password, done) {
        let hitCount = await redis.getAsync(`spamprotect_login_${req.clientIp}`);
        if (hitCount === null)
            hitCount = [];
        else 
            hitCount = JSON.parse(hitCount)


        hitCount = hitCount.filter((unix) => moment.unix(unix / 1000).add(10, 'minutes').isSameOrAfter(moment.now()) && unix !== null)

        if(hitCount.length > 10) {
            console.log(`Rate limit for ${req.clientIp} REACHED: ${hitCount.length}`)
            return done(null, false, req.flash('loginStatus', 'Rate limit exceeded, please wait 10 minutes'));
        }
        
        hitCount.push(moment.now())
        await redis.setAsync(`spamprotect_login_${req.clientIp}`, JSON.stringify(hitCount));
        console.log(`(Login) Rate limit for ${req.clientIp}: ${hitCount.length}`)
        
        const db = (await database()).session;

        // Get user
        const user = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('users')
        .select()
        .where('(username = :username OR email = :email) AND closed = 0')
        .bind('username', username)
        .bind('email', username)
        .execute()
        .then((result) => result.fetchOne())
        .catch((err) => err);
    
        if(user instanceof Error) {
            db.close();
           return done(null, false, req.flash('loginStatus', 'Cannot connect to servers'));
        }

        if(user === undefined) {
            db.close();
            return done(null, false, req.flash('loginStatus', 'That login does not exist'));
        }

        bcrypt.compare(password, user[3], async function(err, cryptRes) {
            if(cryptRes) {
                const updateUser = await db
                 .getSchema(process.env.DB_SCHEMA)
                 .getTable('users')
                 .update()
                 .where('id = :id')
                 .set('lastlogin', moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'))
                 .set('lastloginip', req.clientIp)
                 .bind('id', user[0])
                 .execute()
                 .catch((err) => err);

                 if(updateUser instanceof Error) {
                    logger.error(`Error updating last login for user: ${user[0]}`, updateUser)
                 }

                 db.close();

                 if(user[4] === 1) { 
                    return done(null, user);
                 } else {
                    return done(null, false, req.flash('loginStatus', { message: 'Account not verified! Check your emails or resend it', email: user[2], resend: true }))
                 }
            } else {    
                db.close();
                return done(null, false, req.flash('loginStatus', 'Wrong credentials'));
            }
        });
    }
  ));

// Passport Register
passport.use('register', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true,
  },
    async function(req, username, password, done) {
      username = username.trim();
      password = password.trim();
      if(username.length < 3) {
        return done(null, null, req.flash('registerStatus', { success: false, message: 'Username must be more than 3 characters.'}));
      }

      if(password.length < 6) {
        return done(null, null, req.flash('registerStatus', { success: false, message: 'Password must be longer than 6 characters.'}));
      }

      let hitCount = await redis.getAsync(`spamprotect_register_${req.clientIp}`);
      if (hitCount === null)
          hitCount = [];
      else 
          hitCount = JSON.parse(hitCount)
  
  
      hitCount = hitCount.filter((unix) => moment.unix(unix / 1000).add(10, 'minutes').isSameOrAfter(moment.now()) && unix !== null)
  
      if(hitCount.length > 15) {
          console.log(`Rate limit for ${req.clientIp} REACHED: ${hitCount.length}`)
          return done(null, false, req.flash('registerStatus', 'Rate limit exceeded, please wait 10 minutes'));
      }
      
      hitCount.push(moment.now())
      await redis.setAsync(`spamprotect_register_${req.clientIp}`, JSON.stringify(hitCount));
      console.log(`(Register) Rate limit for ${req.clientIp}: ${hitCount.length}`)
      
      const db = (await database()).session;

      // Check user/email taken
      const user = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('users')
        .select()
        .where('username = :username OR email = :email')
        .bind('username', username)
        .bind('email', req.body.email)
        .execute()
        .then((result) => result.fetchOne())
        .catch((err) => err);

        if(user !== undefined) {
            db.close();
            return done(null, false, req.flash('registerStatus', { success: false, message: 'Username or email is taken'}));
        }

       bcrypt.hash(password, 10, async function(err, hash) { 
            if(err) {
                db.close();
                logger.error('Found error', err);
                return done(err, null, req.flash('registerStatus', { success: false, message: 'Unable to register' }));
            }

            db.startTransaction();

            // Insert user 
            const createUser = await db
                .getSchema(process.env.DB_SCHEMA)
                .getTable('users')
                .insert(['username', 'email', 'password', 'registeredip'])
                .values(username, req.body.email, hash, req.clientIp)
                .execute()
                .catch((err) => err);

            if(createUser instanceof Error) {
                db.rollback();
                db.close();
                logger.error('Found error', createUser);
                return done(err, null, req.flash('registerStatus', { success: false, message: 'Unable to register' }));
            }

            let token = uuidv4().substring(0, 6).toUpperCase();

            // Insert confirmation
            const createConfirmation = await db
                .getSchema(process.env.DB_SCHEMA)
                .getTable('confirmations')
                .insert(['token', 'type', 'email', 'expires'])
                .values(token, 0, req.body.email, moment(moment.now()).add(12, 'hours').unix())
                .execute()
                .catch((err) => err);

            if(createConfirmation instanceof Error) {
                db.rollback();
                db.close();
                logger.error('Found error', createConfirmation);
                return done(err, null, req.flash('registerStatus', { success: false, message: 'Unable to register' }));
            }

            db.commit();
            db.close();
            sendEmailConfirmation(req.body.email, token, username);

            return done(null, null, req.flash('registerStatus', { success: true, message: 'Please check your email for a verification code' }));
        });
    }
));
  
  passport.serializeUser(function(user, done) {
    done(null, user[0]);
  });
  
  passport.deserializeUser(async (id, done) => {
    const db = (await database()).session;

    const user = await db
    .getSchema(process.env.DB_SCHEMA)
    .getTable('users')
    .select()
    .where('id = :id')
    .bind('id', id)
    .execute()
    .then((results) => results.fetchOne())
    .catch((err) => err);

    db.close();
    if(user instanceof Error) {
        db.rollback();
        db.close();
        logger.error('Unable to deserialize user', user);
        return done('Unable to deserialize user');
    }

    if(user === undefined) 
        return done(null);
        
    done(null, {
        id: user[0],
        username: user[1],
        email: user[2],
        email_verified: user[4],
        membership: user[5],
        created: user[6],
        lastlogin: user[7],
        registeredip: user[8],
        lastloginip: user[9],
        isMember: user[5] === -1 ? true : moment.unix(user[5]).add(30, 'days').isSameOrAfter(moment.now()),
        closed: user[10] === '0' ? false : true
    });
  });