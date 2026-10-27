'use strict';
// GET /watchlist -> { pairs: ['EUR/USD', ...] }      (signed-in users only)
// PUT /watchlist  body { pairs: [...] }              replaces the list
const { doc, TABLE, GetCommand, PutCommand } = require('./lib/db');
const { json, userFrom, parseBody } = require('./lib/http');
const { isValidPair } = require('./lib/pairs');

exports.handler = async (event) => {
  const { sub } = userFrom(event);
  if (!sub) return json(401, { error: 'Unauthorized' });
  const key = { pk: `USER#${sub}`, sk: 'WATCHLIST' };

  if (event.requestContext.http.method === 'GET') {
    const { Item } = await doc.send(new GetCommand({ TableName: TABLE, Key: key }));
    return json(200, { pairs: Item?.pairs || [] });
  }

  const body = parseBody(event);
  if (!body || !Array.isArray(body.pairs)) return json(400, { error: 'Body must be { pairs: [...] }' });
  const pairs = [...new Set(body.pairs)];
  if (pairs.length > 20 || !pairs.every(isValidPair)) return json(400, { error: 'Invalid or too many pairs' });

  await doc.send(new PutCommand({ TableName: TABLE, Item: { ...key, pairs, updatedAt: new Date().toISOString() } }));
  return json(200, { pairs });
};
