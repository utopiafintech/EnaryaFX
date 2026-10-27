'use strict';
// Shared pair definitions. Rates are stored per 1 USD, e.g. r.EUR = EUR per 1 USD.
// Keep this list in sync with PAIRS in index.html.

const CURRENCIES = ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'CAD', 'NZD', 'ETB'];

const PAIRS = {
  'EUR/USD': (r) => 1 / r.EUR,
  'GBP/USD': (r) => 1 / r.GBP,
  'USD/JPY': (r) => r.JPY,
  'USD/CHF': (r) => r.CHF,
  'AUD/USD': (r) => 1 / r.AUD,
  'USD/CAD': (r) => r.CAD,
  'NZD/USD': (r) => 1 / r.NZD,
  'EUR/GBP': (r) => r.GBP / r.EUR,
  'EUR/JPY': (r) => r.JPY / r.EUR,
  'GBP/JPY': (r) => r.JPY / r.GBP,
  'ETB/USD': (r) => 1 / r.ETB,
};

const isValidPair = (name) => Object.prototype.hasOwnProperty.call(PAIRS, name);
const pairRate = (name, dayRates) => PAIRS[name](dayRates);

module.exports = { CURRENCIES, PAIRS, isValidPair, pairRate };
