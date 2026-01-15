'use strict';

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

const envResult = dotenv.config({ quiet: true });
if (envResult.error && envResult.error.code !== 'ENOENT') {
  throw new Error(`Failed to load .env: ${envResult.error.message}`);
}

const PORT = parsePort(process.env.PORT, 8080);
const APPROOV_HEADER = 'Approov-Token';
const AUTH_HEADER = 'Authorization';
const DIGEST_HEADER = 'Content-Digest';
const APPROOV_SECRET = loadApproovSecret();

let approovEnabled = true;
let tokenBindingEnabled = true;

// Approov-protected endpoints that require token checks.
const PROTECTED_PATHS = new Set([
  '/token-check',
  '/token-binding',
  '/token-double-binding',
]);

const app = express();
app.disable('x-powered-by');
app.use(cors());

app.use(approovAuthMiddleware);

app.get('/', (req, res) => {
  res.json(infoPayload('Approov demo API is running on port 8080.'));
});

app.get('/approov-state', (req, res) => {
  res.json(statePayload());
});

app.post('/approov/enable', (req, res) => {
  enableApproov();
  res.json(statePayload());
});

app.post('/approov/disable', (req, res) => {
  disableApproov();
  res.json(statePayload());
});

app.post('/token-binding/enable', (req, res) => {
  tokenBindingEnabled = true;
  res.json(statePayload());
});

app.post('/token-binding/disable', (req, res) => {
  tokenBindingEnabled = false;
  res.json(statePayload());
});

app.get('/unprotected', (req, res) => {
  res.json(infoPayload("Unprotected endpoint '/unprotected'; no Approov checks performed."));
});

app.get('/token-check', (req, res) => {
  res.json(infoPayload("Protected endpoint '/token-check'; Approov token verified."));
});

app.get('/token-binding', (req, res) => {
  const authorization = req.get(AUTH_HEADER);
  const payload = infoPayload("Protected endpoint '/token-binding'; Approov token binding enforced.");
  payload.authorizationHeaderPresent = hasText(authorization);
  res.json(payload);
});

app.get('/token-double-binding', (req, res) => {
  const authorization = req.get(AUTH_HEADER);
  const contentDigest = req.get(DIGEST_HEADER);
  const payload = infoPayload("Protected endpoint '/token-double-binding'; dual token binding enforced.");
  payload.authorizationHeaderPresent = hasText(authorization);
  payload.contentDigestHeaderPresent = hasText(contentDigest);
  res.json(payload);
});

const server = app.listen(PORT, () => {
  console.log(`Approov demo API listening on port ${PORT}.`);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

function shutdown(signal) {
  console.log(`Received ${signal}, shutting down.`);
  server.close(() => process.exit(0));
}

// Middleware that enforces Approov token checks on protected endpoints.
function approovAuthMiddleware(req, res, next) {
  if (req.method === 'OPTIONS') {
    return next();
  }

  if (!PROTECTED_PATHS.has(req.path)) {
    return next();
  }

  if (!approovEnabled) {
    return next();
  }

  try {
    const rawToken = trimOrNull(req.get(APPROOV_HEADER));
    const claims = verifyApproovToken(rawToken);

    if (tokenBindingEnabled && needsBindingCheck(req.path)) {
      const bindingValue = extractBindingValue(req.path, req);
      if (!hasText(bindingValue)) {
        throw new ApproovAuthError('Missing binding header value.');
      }
      verifyTokenBinding(bindingValue, claims);
    }

    return next();
  } catch (err) {
    logAuthFailure(err);
    return unauthorized(res);
  }
}

// Token validation logic: signature check, expiration, and binding (when enabled).
function verifyApproovToken(token) {
  if (!hasText(token)) {
    throw new ApproovAuthError('Approov token missing.');
  }

  let claims;
  try {
    claims = jwt.verify(token, APPROOV_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: true,
    });
  } catch (err) {
    throw new ApproovAuthError('Approov token verification failed.');
  }

  const exp = Number(claims.exp);
  if (!Number.isFinite(exp)) {
    throw new ApproovAuthError('Approov token missing expiration.');
  }
  if (exp * 1000 <= Date.now()) {
    throw new ApproovAuthError('Approov token expired.');
  }

  return claims;
}

function verifyTokenBinding(bindingValue, claims) {
  const expected = typeof claims.pay === 'string' ? claims.pay.trim() : '';
  if (!hasText(expected)) {
    throw new ApproovAuthError('Approov token missing binding payload.');
  }

  const computed = hashBase64(bindingValue);
  if (computed !== expected) {
    throw new ApproovAuthError('Approov token binding mismatch.');
  }
}

function extractBindingValue(path, req) {
  if (path === '/token-binding') {
    return trimOrNull(req.get(AUTH_HEADER));
  }

  const authorization = trimOrNull(req.get(AUTH_HEADER));
  const digest = trimOrNull(req.get(DIGEST_HEADER));
  if (!hasText(authorization) || !hasText(digest)) {
    return null;
  }
  return authorization + digest;
}

function needsBindingCheck(path) {
  return path === '/token-binding' || path === '/token-double-binding';
}

function enableApproov() {
  approovEnabled = true;
  tokenBindingEnabled = true;
}

function disableApproov() {
  approovEnabled = false;
  tokenBindingEnabled = false;
}

function statePayload() {
  return {
    approovEnabled,
    tokenBindingEnabled,
  };
}

function infoPayload(details) {
  return {
    ...statePayload(),
    details,
  };
}

function loadApproovSecret() {
  const raw = process.env.APPROOV_BASE64URL_SECRET;
  if (!hasText(raw)) {
    throw new Error('APPROOV_BASE64URL_SECRET environment variable is not set.');
  }

  try {
    const decoded = Buffer.from(raw.trim(), 'base64url');
    if (decoded.length === 0) {
      throw new Error('APPROOV_BASE64URL_SECRET decoded to an empty value.');
    }
    return decoded;
  } catch (err) {
    throw new Error('APPROOV_BASE64URL_SECRET must be base64url encoded.');
  }
}

function hashBase64(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('base64');
}

function unauthorized(res) {
  res.status(401).json({});
}

function logAuthFailure(err) {
  if (err instanceof ApproovAuthError) {
    console.warn(`[Approov] ${err.message}`);
    return;
  }
  console.warn('[Approov] Unexpected authentication error.', err);
}

function hasText(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function trimOrNull(value) {
  return typeof value === 'string' ? value.trim() : null;
}

function parsePort(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

class ApproovAuthError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ApproovAuthError';
  }
}
