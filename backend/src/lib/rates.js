'use strict';
const { CURRENCIES } = require('./pairs');

// =====================================================================
// DATA PROVIDER: swap this ONE function to change provider / add a key.
// Must return an array of daily objects (oldest -> newest), each shaped
// like { USD: 1, EUR: 0.92, ... } (units per 1 USD).
// Provider: Frankfurter v2 (free, no key, daily reference rates, has ETB).
// To use a keyed provider, read the key from an environment variable
// (set in template.yaml, ideally from SSM Parameter Store), never hard-code it.
// =====================================================================
async function fetchSeries(days = 14) {
  const start = new Date(Date.now() - 21 * 86400000).toISOString().slice(0, 10);
  const url = `https://api.frankfurter.dev/v2/rates?base=USD&quotes=${CURRENCIES.join(',')}&from=${start}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Rates API error ${res.status}`);
  const text = await res.text();
  return normalize(text, days);
}

// Accepts a JSON array or NDJSON of { date, base, quote, rate } rows.
function normalize(text, days = 14) {
  const t = text.trim();
  const rows = t.startsWith('[') ? JSON.parse(t) : t.split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
  const byDate = {};
  for (const r of rows) (byDate[r.date] = byDate[r.date] || { USD: 1 })[r.quote] = r.rate;
  const series = Object.keys(byDate)
    .sort()
    .map((d) => byDate[d])
    .filter((day) => CURRENCIES.every((c) => day[c]));
  if (series.length < 2) throw new Error('Not enough rate data');
  return series.slice(-days);
}

module.exports = { fetchSeries, normalize };
