const csrf = require('csurf');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const http = require('http');
const https = require('https');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const passport = require('./passport');
const flash = require('connect-flash');
const requestIp = require('request-ip');
const redis = require('./redis');
const cloudflare = require('cloudflare-express');
const fs = require('fs')
const privateKey  = fs.readFileSync('./ssl/server.key', 'utf8');
const certificate = fs.readFileSync('./ssl/server.crt', 'utf8');
const credentials = { key: privateKey, cert: certificate };

/** Server setup */
const app = express();
const server = http.createServer(app);

const root = path.normalize(`${__dirname}/..`);
let sessionMiddleware = {
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  name: 'leakedsearch_session',
  resave: false,
  saveUninitialized: false,
  cookie: {
    expire: 1.728e+8, // 12 hou
    secure: (process.env.COOKIE_SECURE === 'true'),
    httpOnly: true,
    domain: process.env.COOKIE_DOMAIN,
    path: '/',
  },
};

// - Add & configure middleware
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true);
}

app.set('view engine', 'ejs');

app.use(cloudflare.restore());
app.use(express.static(path.join(root, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

// - CORS AND MORE
if (process.env.ENV === 'production') {
  app.set('trust proxy', 1)
  sessionMiddleware.cookie.secure = true;
  app.use(cors({ origin: ["https://leakedsearch.com/"], credentials: true }));
}

app.use(session(sessionMiddleware));

// - Initialize passport and session manager
app.use(passport.initialize());
app.use(passport.session());

// - Use flash
app.use(flash());

// - Use clientip 
app.use(requestIp.mw())

var api = require('../routes/payment/coinbase');
app.use('/payment/coinbase', api)

// - CSRF
app.use(csrf({
  cookie: false, 
}));

// - Add Routes
app.use('/', require('../routes/index'));

// - Add error pages
app.use((req, res) => {
  res.status(404).render('./error/404', { title: 'Error', path: req.path.replace('/', '') });
});

if(process.env.ENV === 'production') { 
  function wwwRedirect(req, res, next) {
    if (req.headers.host.slice(0, 4) === 'www.') {
        var newHost = req.headers.host.slice(4);
        return res.redirect(301, 'https://' + newHost + req.originalUrl);
    }
    next();
  };
  
  app.use(wwwRedirect);
  app.use (function (req, res, next) {
    if (req.secure) {
            // request was via https, so do no special handling
            next();
    } else {
            // request was via http, so redirect to https
            res.redirect('https://' + req.headers.host + req.url);
    }
  });
}

// - Error handler for wrong CSRF Token
app.use((err, req, res, next) => {
  if (err.code !== 'EBADCSRFTOKEN') return next(err);
  return res.sendStatus(403);
});

if(process.env.ENV === 'production') {
  http.createServer(app).listen(80);
  https.createServer(credentials, app).listen(443);
} else {
  server.listen(1234);
}

module.exports = { server, sessionMiddleware };
