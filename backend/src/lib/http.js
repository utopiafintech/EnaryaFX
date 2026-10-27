'use strict';
// Small helpers for API Gateway HTTP API (payload v2) responses and requests.
// CORS headers are added by API Gateway itself (see template.yaml).

const json = (statusCode, body, headers = {}) => ({
  statusCode,
  headers: { 'content-type': 'application/json', ...headers },
  body: JSON.stringify(body),
});

// The signed-in user's Cognito id (sub) and email, from the verified JWT.
const userFrom = (event) => {
  const claims = event.requestContext?.authorizer?.jwt?.claims || {};
  return { sub: claims.sub, email: claims.email };
};

const parseBody = (event) => {
  try {
    return event.body ? JSON.parse(event.body) : {};
  } catch {
    return null; // caller returns 400
  }
};

module.exports = { json, userFrom, parseBody };
