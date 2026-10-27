'use strict';

// An alert fires when the current rate crosses the target in the chosen direction.
const isHit = (direction, target, current) =>
  direction === 'above' ? current >= target : current <= target;

// Validates the body of POST /alerts. Returns { error } or { value }.
function validateAlert(body, isValidPair) {
  if (!body || typeof body !== 'object') return { error: 'Invalid JSON body' };
  const { pair, direction, target } = body;
  if (!isValidPair(pair)) return { error: 'Unknown pair' };
  if (direction !== 'above' && direction !== 'below') return { error: 'direction must be "above" or "below"' };
  if (typeof target !== 'number' || !Number.isFinite(target) || target <= 0) return { error: 'target must be a positive number' };
  return { value: { pair, direction, target } };
}

module.exports = { isHit, validateAlert };
