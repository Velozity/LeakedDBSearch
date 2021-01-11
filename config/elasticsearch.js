/* eslint-disable func-names */
const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://45.76.231.155:9200' })

module.exports = client;
