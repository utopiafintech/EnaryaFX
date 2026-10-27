'use strict';
// Scheduled (hourly): compare cached rates with every active alert and email
// the user when one fires. Each alert fires once, then is marked triggered.
// Note: a table Scan is fine for a small app; switch to a GSI if alerts grow large.
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { doc, TABLE, GetCommand, ScanCommand, UpdateCommand } = require('./lib/db');
const { pairRate } = require('./lib/pairs');
const { isHit } = require('./lib/alertLogic');

const ses = new SESClient({});
const FROM = process.env.ALERT_FROM_EMAIL;

exports.handler = async () => {
  const { Item } = await doc.send(new GetCommand({ TableName: TABLE, Key: { pk: 'RATES', sk: 'LATEST' } }));
  if (!Item) return { checked: 0, fired: 0 };
  const latest = Item.series[Item.series.length - 1];

  let checked = 0, fired = 0, startKey;
  do {
    const page = await doc.send(new ScanCommand({
      TableName: TABLE,
      FilterExpression: 'begins_with(sk, :p) AND triggered = :f',
      ExpressionAttributeValues: { ':p': 'ALERT#', ':f': false },
      ExclusiveStartKey: startKey,
    }));
    startKey = page.LastEvaluatedKey;

    for (const a of page.Items || []) {
      checked++;
      const current = pairRate(a.pair, latest);
      if (!isHit(a.direction, a.target, current)) continue;

      // Mark first (conditionally) so a retry can never email the same alert twice.
      try {
        await doc.send(new UpdateCommand({
          TableName: TABLE, Key: { pk: a.pk, sk: a.sk },
          UpdateExpression: 'SET triggered = :t, triggeredAt = :at',
          ConditionExpression: 'triggered = :f',
          ExpressionAttributeValues: { ':t': true, ':f': false, ':at': new Date().toISOString() },
        }));
      } catch (e) {
        if (e.name === 'ConditionalCheckFailedException') continue;
        throw e;
      }

      await ses.send(new SendEmailCommand({
        Source: FROM,
        Destination: { ToAddresses: [a.email] },
        Message: {
          Subject: { Data: `Enarya FX alert: ${a.pair} is ${a.direction} ${a.target}` },
          Body: {
            Text: {
              Data: `${a.pair} is now ${current.toFixed(6)}, which is ${a.direction} your target of ${a.target}.\n\n` +
                'Enarya FX provides information for educational purposes only and is not financial advice.',
            },
          },
        },
      }));
      fired++;
    }
  } while (startKey);

  return { checked, fired };
};
