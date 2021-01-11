const Paypal = require('paypal-express-checkout');
// debug = optional, defaults to false, if true then paypal's sandbox url is used
// paypal.init('some username', 'some password', 'signature', 'return url', 'cancel url', debug);

var paypal = Paypal.init(process.env.paypal_username, 
    process.env.paypal_password, 
    process.env.paypal_signature, 
    process.env.WB_DOMAIN + process.env.paypal_returnurl, 
    process.env.WB_DOMAIN + process.env.paypal_cancelurl, 
    true);

console.log(process.env.WB_DOMAIN + process.env.paypal_cancelurl);
console.log(process.env.WB_DOMAIN + process.env.paypal_returnurl);
module.exports = paypal;