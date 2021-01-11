/* eslint-disable global-require */

module.exports = {
  config: require('./config'), // MUST HAVE A DIFFERENT PRODUCTION CONFIG
  logger: require('./winston'),
  database: require('./database'),
  elastic: require('./elasticsearch'),
  redis: require('./redis'),
  passport: require('./passport'),
  mailer: require('./mailer'),
  paypal: require('./paypal'),
  coinbase: require('./coinbase')
};
