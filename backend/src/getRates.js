'use strict';
// GET /rates -> { updatedAt, series: [ { USD:1, EUR:0.86, ... }, ... ] } (oldest -> newest)
const { doc, TABLE, GetCommand } = require('./lib/db');
const { json } = require('./lib/http');

exports.handler = async () => {
  const { Item } = await doc.send(new GetCommand({ TableName: TABLE, Key: { pk: 'RATES', sk: 'LATEST' } }));
  if (!Item) return json(503, { error: 'Rates not loaded yet. Try again shortly.' });
  return json(200, { updatedAt: Item.updatedAt, series: Item.series }, { 'cache-control': 'public, max-age=300' });
};
