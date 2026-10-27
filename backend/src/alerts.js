'use strict';
// GET    /alerts       -> { alerts: [...] }
// POST   /alerts       body { pair, direction: 'above'|'below', target: number }
// DELETE /alerts/{id}
// All routes require a signed-in user. An alert emails the user once when it fires.
const crypto = require('crypto');
const { doc, TABLE, QueryCommand, PutCommand, DeleteCommand } = require('./lib/db');
const { json, userFrom, parseBody } = require('./lib/http');
const { isValidPair } = require('./lib/pairs');
const { validateAlert } = require('./lib/alertLogic');

const MAX_ALERTS = 10;

const listAlerts = async (sub) => {
  const { Items } = await doc.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :p)',
    ExpressionAttributeValues: { ':pk': `USER#${sub}`, ':p': 'ALERT#' },
  }));
  return Items || [];
};

const publicShape = (a) => ({
  id: a.sk.slice('ALERT#'.length), pair: a.pair, direction: a.direction, target: a.target,
  triggered: !!a.triggered, createdAt: a.createdAt, triggeredAt: a.triggeredAt,
});

exports.handler = async (event) => {
  const { sub, email } = userFrom(event);
  if (!sub) return json(401, { error: 'Unauthorized' });
  const route = event.routeKey; // e.g. 'GET /alerts'

  if (route === 'GET /alerts') {
    return json(200, { alerts: (await listAlerts(sub)).map(publicShape) });
  }

  if (route === 'POST /alerts') {
    const { error, value } = validateAlert(parseBody(event), isValidPair);
    if (error) return json(400, { error });
    if (!email) return json(400, { error: 'Your account has no email address' });
    if ((await listAlerts(sub)).length >= MAX_ALERTS) return json(400, { error: `Limit of ${MAX_ALERTS} alerts reached` });

    const id = crypto.randomUUID();
    const item = { pk: `USER#${sub}`, sk: `ALERT#${id}`, ...value, email, triggered: false, createdAt: new Date().toISOString() };
    await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
    return json(201, { alert: publicShape(item) });
  }

  if (route === 'DELETE /alerts/{id}') {
    const id = event.pathParameters?.id;
    if (!id) return json(400, { error: 'Missing id' });
    await doc.send(new DeleteCommand({ TableName: TABLE, Key: { pk: `USER#${sub}`, sk: `ALERT#${id}` } }));
    return json(200, { deleted: id });
  }

  return json(404, { error: 'Not found' });
};
