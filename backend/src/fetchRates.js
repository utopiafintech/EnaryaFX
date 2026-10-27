'use strict';
// Scheduled (hourly): fetch rates once and cache them in DynamoDB.
// If the provider fails, we throw so the error shows in CloudWatch and
// the previously cached rates keep being served.
const { doc, TABLE, PutCommand } = require('./lib/db');
const { fetchSeries } = require('./lib/rates');

exports.handler = async () => {
  const series = await fetchSeries(14);
  await doc.send(new PutCommand({
    TableName: TABLE,
    Item: { pk: 'RATES', sk: 'LATEST', series, updatedAt: new Date().toISOString() },
  }));
  return { days: series.length };
};
