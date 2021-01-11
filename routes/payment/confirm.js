const confirm = require('express').Router();
const moment = require('moment');
const paypal = require('../../config/paypal');
const database = require('../../config/database');
const logger = require('../../config/winston');
const { v4: uuid } = require('uuid');
const { sendPaymentConfirmation } = require('../../config/mailer');

// - profile GET route
confirm.get('/', async (req, res) => {
    const {
        token,
        PayerID
    } = req.query;

    if(token === undefined || PayerID === undefined) {
        res.redirect('/login');
        return;
    }

    paypal.detail(token, PayerID, async function(err, data, invoiceNumber, price, custom_data_array) {
        if (err) {
            req.flash('purchaseStatus', 'An error occured, please contact us.')
            res.redirect('/account');
            return;
        }

        if (data.success) { 
            const db = (await database()).session;
            const checkTransExists = await db
            .getSchema(process.env.DB_SCHEMA)
            .getTable('transactions')
            .select()
            .where('t_id = :t_id')
            .bind('t_id', custom_data_array[0])
            .execute()
            .then((results) => results.fetchAll())
            .catch((err) => err);

            if(checkTransExists !== undefined && checkTransExists.length > 0) {
                db.close();
                req.flash('purchaseStatus', 'This order is already completed.')
                res.redirect('/account');
                return;
            }

            let t_id, u_id, pp_desc, pp_amount, pp_currency, pp_email, pp_timestamp; 
            t_id = custom_data_array[0];
            u_id = custom_data_array[3];
            pp_desc = data.DESC;
            pp_amount = data.AMT;
            pp_currency = data.CURRENCYCODE;
            pp_email = data.EMAIL;
            pp_timestamp = data.TIMESTAMP;

            // Successful payment
            if(data.ACK === 'Success') {
                let expires = moment(moment.now()).add(30, 'days').unix();
                // Update membership expiration status
                const updateMembership = await db
                .getSchema(process.env.DB_SCHEMA)
                .getTable('users')
                .update()
                .where('id = :id')
                .set('membership', expires)
                .bind('id', u_id)
                .execute()
                .catch((err) => err);
                
                if(updateMembership instanceof Error) {
                    db.close();
                    logger.error('UPDATE MEMBERSHIP ERROR', updateMembership);
                    req.flash('purchaseStatus', 'An error occured, please contact us.')
                    res.redirect('/account');
                    return;
                }

                // Insert transaction log
                const transactionLog = await db
                .getSchema(process.env.DB_SCHEMA)
                .getTable('transactions')
                .insert(['t_id', 'u_id', 'pp_amount', 'pp_desc', 'pp_currency', 'pp_email', 'pp_timestamp'])
                .values(t_id, u_id, pp_amount, pp_desc, pp_currency, pp_email, pp_timestamp)
                .execute()
                .catch((err) => err);

                db.close();
                if(transactionLog instanceof Error) {
                    logger.error('TRANSACTION LOG ERROR', transactionLog);
                }

                sendPaymentConfirmation(req.user.email, t_id, pp_amount, pp_desc, req.user.username, moment.unix(expires).format('MM/DD/YYYY'))
                req.flash('purchaseStatus', 'You are now a member! Confirmation email sent.')
                res.redirect('/account');
                return;
            }
         }
    });
});

module.exports = confirm;
