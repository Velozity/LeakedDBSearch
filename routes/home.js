const home = require('express').Router();
const elastic = require('../config/elasticsearch');

// - home GET route
home.get('/', async (req, res) => {
    const { body: databaseSize } = await elastic.count({ index: process.env.E_INDEX })
    .catch((e) => {
      console.log(e);
      return 0;
    });

    res.render('home', { 
        user: req.user,
        title: 'Welcome', 
        csrfToken: req.csrfToken(),
        database_size: databaseSize.count.toString()
    });
});

module.exports = home;
