const stats = require('express').Router();
const database = require('../config/elasticsearch');

// - stats POST route
stats.post('/', async (req, res) => {
  // IF LOGGED IN
  const { 
    query
  } = req.body;

  let startTime = process.hrtime();

  const { body: countResults } = await database.count({ index: process.env.E_INDEX });

  const elapsedSeconds = parseHrtimeToSeconds(process.hrtime(startTime));

  res.status(200).json({
    execution_time: elapsedSeconds,
    results: {
      total_row_size: countResults.count
    }
  })
})

function parseHrtimeToSeconds(hrtime) {
  const seconds = (hrtime[0] + (hrtime[1] / 1e9)).toFixed(3);
  return seconds;
}

module.exports = stats;
