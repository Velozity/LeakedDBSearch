const coinbase = require('express').Router();
const moment = require('moment');
const logger = require('../../config/winston');
const database = require('../../config/database');
const { v4: uuid } = require('uuid');
const redis = require('../../config/redis')
const { sendPaymentConfirmation } = require('../../config/mailer');
const Webhook = require('coinbase-commerce-node').Webhook;

// - coinbase POST route
coinbase.post('/', async (req, res) => {
   const { 
       id,
       type,
       created_at
   } = req.body.event;
     
    try {
        Webhook.verifySigHeader(req.rawBody, req.headers['x-cc-webhook-signature'], process.env.COINBASE_SHARED_SECRET);
    } catch(error) {
        logger.warn('Fake coinbase breach attempt', error);
        res.status(400);
        return;
    }

   const code = req.body.event.data.code;
   if(type === 'charge:confirmed') {
    console.log('Received payment: ' + code);
        let tData = await redis.getAsync(`cointransaction_${code}`);

        try {
            tData = JSON.parse(tData);
        } catch {
            console.log('wrong data in coinbase')
            res.status(400);
            return;
        }

        if(tData === null) {
            console.log('wrong data in coinbase')
            res.status(400);
            return;
        }

        console.log('tdata:')
        console.log(tData);

        // Give membership
        let expires = moment(moment.now()).add(30, 'days').unix();
        
        const db = (await database()).session;
        // Update membership expiration status
        const updateMembership = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('users')
        .update()
        .where('id = :id')
        .set('membership', expires)
        .bind('id', tData.u_id)
        .execute()
        .catch((err) => err);
        
        if(updateMembership instanceof Error) {
            db.close();
            logger.error('Membership update error', updateMembership);
            res.status(400);
            return;
        }

        const transactionLog = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('transactions')
        .insert(['t_id', 'u_id', 'pp_amount', 'pp_desc', 'pp_currency', 'pp_email', 'pp_timestamp'])
        .values(tData.t_id, tData.u_id, 5, 'LeakedSearch 30 Day Membership', 'COINBASE', id, created_at)
        .execute()
        .catch((err) => err);

        if(transactionLog instanceof Error) {
            logger.error('TRANSACTION LOG ERROR', transactionLog);
        }

        const getUser = await db
        .getSchema(process.env.DB_SCHEMA)
        .getTable('users')
        .select()
        .where('id = :id')
        .bind('id', tData.u_id)
        .execute()
        .then((result) => result.fetchOne())
        .catch((err) => err);

        db.close();
        if(getUser instanceof Error || getUser === undefined || getUser.length === 0) {
            logger.error('GRAB USER DURING PAYMENT ERROR', getUser);
            res.status(200);
            return;
        }

        sendPaymentConfirmation(getUser[2], tData.t_id, 5.00, 'LeakedSearch 30 Day Membership', getUser[1], moment.unix(expires).format('MM/DD/YYYY'))    
        res.status(200);
   }

   return res.status(404);
});

module.exports = coinbase;
