'use strict';
// GET /news -> { items: [ { tag, title, text, url } ] }
// Reads items stored at pk=NEWS, sk=LATEST. Until you connect a news source
// (e.g. a scheduled function that writes there), it returns placeholders.
const { doc, TABLE, GetCommand } = require('./lib/db');
const { json } = require('./lib/http');

const PLACEHOLDERS = [
  { tag: 'Central Banks', title: 'Placeholder: Central bank policy update', text: 'Connect a news source to show real headlines here.', url: '#' },
  { tag: 'ETB/USD', title: 'Placeholder: Birr market update', text: 'Connect a news source to show real headlines here.', url: '#' },
  { tag: 'Markets', title: 'Placeholder: Weekly market outlook', text: 'Connect a news source to show real headlines here.', url: '#' },
];

exports.handler = async () => {
  const { Item } = await doc.send(new GetCommand({ TableName: TABLE, Key: { pk: 'NEWS', sk: 'LATEST' } }));
  return json(200, { items: Item?.items || PLACEHOLDERS }, { 'cache-control': 'public, max-age=300' });
};
