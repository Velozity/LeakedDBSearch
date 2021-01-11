const search = require('express').Router();
const redis = require('../config/redis');
const elastic = require('../config/elasticsearch');
const database = require('../config/database');
const moment = require('moment');
const logger = require('../config/winston');

// - search GET route
search.get('/', async (req, res) => {
  if(!req.user) {
    res.redirect('/login');
    return;
  }

  const { body: databaseSize } = await elastic.count({ index: process.env.E_INDEX })
    .catch((e) => {
      console.log(e);
      return 0;
    });

  res.render('search', { 
    user: req.user,
    title: 'Search',
    csrfToken: req.csrfToken(), 
    database_size: databaseSize.count.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
  });
});

search.post('/', async (req, res) => {
  // IF LOGGED IN
  if(!req.user) {
    res.json({
      error: 'Permission denied'
    });
    return;
  }

  if(!req.user.isMember) {
    res.json({
      error: 'You are not a member'
    });
    return;
  }

    // Spam prevention
  let hitCount = await redis.getAsync(`spamprotect_${req.user.id}`);
  if (hitCount === null)
    hitCount = [];
  else 
    hitCount = JSON.parse(hitCount)


  hitCount = hitCount.filter((unix) => moment.unix(unix / 1000).add(5, 'minutes').isSameOrAfter(moment.now()) && unix !== null)

  if(hitCount.length > 100) {
    console.log(`Rate limit for ${req.user.username} REACHED: ${hitCount.length}`)
    res.json({
      rate_limit: true
    });
    return;
  }
  
  hitCount.push(moment.now())
  await redis.setAsync(`spamprotect_${req.user.id}`, JSON.stringify(hitCount));
  console.log(`Rate limit for ${req.user.username}: ${hitCount.length}`)

  const { 
    search,
    wildcard
  } = req.body;
  console.log(`Search query: ${search}`)

  let result = [];

  const startTime = process.hrtime();
  if(search.trim() === '') {
    const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));
    res.json({
      execution_time: elapsedSeconds,
      results: []
    })
    return;
  }

  let searchQuery = new Array();
  if(search.includes('@')) {
    searchQuery.push({ term: { "email": search }});
  }

  if(search.includes('.') || search.includes(':')) {
    searchQuery.push({ term: { "ip": search }});
  }

  searchQuery.push({ term: { "user": search }});

  const { body } = await elastic.search({
      index: process.env.E_INDEX,
      size: 50,
      body: {
        query: {
            bool: { 
                should: searchQuery
            }
        }
    }
    }).catch((e) => e);

  const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));  

  const db = (await database()).session;
  const whitelistUserSearch = await db
                .getSchema(process.env.DB_SCHEMA)
                .getTable('whitelist_user')
                .select(['user'])
                .where(body.hits.hits.filter((r) => r._source.user !== null).map((r) => `user = '${r._source.user}'`).join(' OR '))
                .execute()
                .then((results) => results.fetchAll())
                .catch((err) => err);

  if(whitelistUserSearch instanceof Error) {
      db.close();
      logger.error('Found error', whitelistUserSearch);
      return;
  }

  const whitelistEmailSearch = await db
  .getSchema(process.env.DB_SCHEMA)
  .getTable('whitelist_email')
  .select(['email'])
  .where(body.hits.hits.filter((r) => r._source.email !== null).map((r) => `email = '${r._source.email}'`).join(' OR '))
  .execute()
  .then((results) => results.fetchAll())
  .catch((err) => err);

  if(whitelistEmailSearch instanceof Error) {
    db.close();
    logger.error('Found error', whitelistEmailSearch);
    return;
  }

  console.log(whitelistEmailSearch);
  console.log(whitelistUserSearch);
  res.json({
    execution_time: elapsedSeconds,
    results: body.hits.hits
    .filter((r) => r._source.user !== null && !whitelistUserSearch.map((e) => e[0].toLowerCase()).includes(r._source.user.toLowerCase()))
    .filter((r) => r._source.email !== null && !whitelistEmailSearch.map((e) => e[0].toLowerCase()).includes(r._source.email.toLowerCase()))
    .map((r) => r._source)
  });

  const logSearch = await db
                .getSchema(process.env.DB_SCHEMA)
                .getTable('search')
                .insert(['u_id', 'query', 'hits'])
                .values(req.user.id, search, body.hits.hits.length)
                .execute()
                .catch((err) => err);

  db.close();
  if(logSearch instanceof Error) {
      logger.error('Found error', logSearch);
      return;
  }
})

function parseHrtimeToSeconds(hrtime) {
  const seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
  return seconds;
}

module.exports = search;
