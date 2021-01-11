const cb = require('coinbase-commerce-node');
const Client = cb.Client;
 
const coinbase = Client.init(process.env.COINBASE_API_KEY);
coinbase.setRequestTimeout(5000);

module.exports = coinbase;