'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { normalize } = require('../src/lib/rates');
const { PAIRS, isValidPair, pairRate } = require('../src/lib/pairs');
const { isHit, validateAlert } = require('../src/lib/alertLogic');

const day = (date, k = 1) => [
  ['EUR', 0.86], ['GBP', 0.75], ['JPY', 150], ['CHF', 0.8], ['AUD', 1.5], ['CAD', 1.4], ['NZD', 1.7], ['ETB', 150],
].map(([quote, rate]) => ({ date, base: 'USD', quote, rate: rate * k }));

test('normalize groups rows by date, oldest to newest (JSON array)', () => {
  const rows = [...day('2026-10-02'), ...day('2026-10-01')];
  const s = normalize(JSON.stringify(rows));
  assert.equal(s.length, 2);
  assert.equal(s[0].USD, 1);
  assert.equal(s[1].ETB, 150);
});

test('normalize accepts NDJSON and drops days missing a currency', () => {
  const rows = [...day('2026-10-01'), ...day('2026-10-02'), ...day('2026-10-03').slice(0, 3)];
  const s = normalize(rows.map((r) => JSON.stringify(r)).join('\n'));
  assert.equal(s.length, 2);
});

test('normalize throws when there is too little data', () => {
  assert.throws(() => normalize(JSON.stringify(day('2026-10-01'))), /Not enough/);
});

test('pair maths', () => {
  const r = { USD: 1, EUR: 0.8, GBP: 0.5, JPY: 100, CHF: 1, AUD: 1, CAD: 1, NZD: 1, ETB: 200 };
  assert.equal(pairRate('EUR/USD', r), 1.25);
  assert.equal(pairRate('EUR/GBP', r), 0.625);
  assert.equal(pairRate('ETB/USD', r), 0.005);
  assert.ok(isValidPair('ETB/USD'));
  assert.ok(!isValidPair('constructor'));
  assert.ok(!isValidPair('FOO/BAR'));
  assert.equal(Object.keys(PAIRS).length, 11);
});

test('alert hit logic', () => {
  assert.ok(isHit('above', 1.1, 1.1));
  assert.ok(!isHit('above', 1.1, 1.09));
  assert.ok(isHit('below', 1.1, 1.09));
  assert.ok(!isHit('below', 1.1, 1.11));
});

test('alert validation', () => {
  const ok = validateAlert({ pair: 'EUR/USD', direction: 'above', target: 1.2 }, isValidPair);
  assert.deepEqual(ok.value, { pair: 'EUR/USD', direction: 'above', target: 1.2 });
  for (const bad of [null, { pair: 'X/Y', direction: 'above', target: 1 }, { pair: 'EUR/USD', direction: 'up', target: 1 },
    { pair: 'EUR/USD', direction: 'above', target: '1.2' }, { pair: 'EUR/USD', direction: 'above', target: -1 }]) {
    assert.ok(validateAlert(bad, isValidPair).error);
  }
});
