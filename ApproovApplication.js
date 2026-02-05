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
const SESSION_ID_HEADER = 'SessionId';
const REQUIRED_SECRET_PLACEHOLDER = 'approov_base64url_secret_here';
const APPROOV_SECRET = loadApproovSecret();

let approovEnabled = true;
let tokenBindingEnabled = true;

// Approov-protected endpoints that require token checks.
const PROTECTED_PATHS = new Set([
  '/token-check',
  '/token-binding',
  '/token-double-binding',
]);

const APPROOV_ERROR_CODES = {
  MISSING_TOKEN: 'missing_approov_token',
  TOKEN_VERIFICATION_FAILED: 'token_verification_failed',
  TOKEN_MISSING_EXPIRATION: 'token_missing_expiration',
  TOKEN_EXPIRED: 'token_expired',
  MISSING_BINDING_HEADER: 'missing_binding_header',
  BINDING_MISMATCH: 'binding_mismatch',
};

const app = express();
app.disable('x-powered-by');
app.use(cors());

app.use(requestLoggingMiddleware);
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
  const sessionId = req.get(SESSION_ID_HEADER);
  const payload = infoPayload("Protected endpoint '/token-double-binding'; dual token binding enforced.");
  payload.authorizationHeaderPresent = hasText(authorization);
  payload.sessionIdHeaderPresent = hasText(sessionId);
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
    req.approovSummary = 'approov_not_required';
    req.approovRequiredHeaders = [];
    return next();
  }

  req.approovRequiredHeaders = requiredHeadersFor(req.path, approovEnabled, tokenBindingEnabled);

  if (!approovEnabled) {
    req.approovSummary = 'approov_disabled';
    return next();
  }

  try {
    const rawToken = trimOrNull(req.get(APPROOV_HEADER));
    const claims = verifyApproovToken(rawToken);

    if (tokenBindingEnabled) {
      const bindingHeaders = bindingHeadersFor(req.path);
      if (bindingHeaders.length > 0) {
        const bindingValue = extractBindingValue(req, bindingHeaders);
        if (!hasText(bindingValue)) {
          throw new ApproovAuthError(
            APPROOV_ERROR_CODES.MISSING_BINDING_HEADER,
            'Missing binding header value.'
          );
        }
        if (!isBindingValid(bindingValue, claims)) {
          throw new ApproovAuthError(
            APPROOV_ERROR_CODES.BINDING_MISMATCH,
            'Approov token binding mismatch.'
          );
        }
      }
    }

    req.approovSummary = 'approov_ok';
    return next();
  } catch (err) {
    setApproovFailureSummary(req, err);
    logAuthFailure(err);
    return unauthorized(res);
  }
}

// Token validation logic: signature check, expiration, and binding (when enabled).
function verifyApproovToken(token) {
  if (!hasText(token)) {
    throw new ApproovAuthError(APPROOV_ERROR_CODES.MISSING_TOKEN, 'Approov token missing.');
  }

  let claims;
  try {
    claims = jwt.verify(token, APPROOV_SECRET, {
      algorithms: ['HS256'],
      ignoreExpiration: true,
    });
  } catch (err) {
    throw new ApproovAuthError(
      APPROOV_ERROR_CODES.TOKEN_VERIFICATION_FAILED,
      'Approov token verification failed.'
    );
  }

  const exp = Number(claims.exp);
  if (!Number.isFinite(exp)) {
    throw new ApproovAuthError(
      APPROOV_ERROR_CODES.TOKEN_MISSING_EXPIRATION,
      'Approov token missing expiration.'
    );
  }
  if (exp * 1000 <= Date.now()) {
    throw new ApproovAuthError(APPROOV_ERROR_CODES.TOKEN_EXPIRED, 'Approov token expired.');
  }

  return claims;
}

function isBindingValid(bindingValue, claims) {
  const expected = typeof claims.pay === 'string' ? claims.pay.trim() : '';
  if (!hasText(expected)) {
    return false;
  }

  const computed = hashBase64(bindingValue);
  return timingSafeEquals(expected, computed);
}

function extractBindingValue(req, bindingHeaders) {
  if (bindingHeaders.length === 0) {
    return null;
  }

  const values = [];
  for (const header of bindingHeaders) {
    const value = trimOrNull(req.get(header));
    if (!hasText(value)) {
      return null;
    }
    values.push(value);
  }

  if (values.length === 0) {
    return null;
  }

  return values.join('');
}

function bindingHeadersFor(path) {
  if (path === '/token-binding') {
    return [AUTH_HEADER];
  }
  if (path === '/token-double-binding') {
    return [AUTH_HEADER, SESSION_ID_HEADER];
  }
  return [];
}

function requiredHeadersFor(path, approovState, bindingState) {
  if (!PROTECTED_PATHS.has(path) || !approovState) {
    return [];
  }

  const headers = [APPROOV_HEADER];
  if (bindingState) {
    headers.push(...bindingHeadersFor(path));
  }
  return headers;
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
  if (!hasText(raw) || raw.trim() === REQUIRED_SECRET_PLACEHOLDER) {
    console.error('[Approov] Required secret is not set');
    throw new Error('APPROOV_BASE64URL_SECRET environment variable is not set.');
  }

  try {
    const decoded = Buffer.from(raw.trim(), 'base64url');
    if (decoded.length === 0) {
      throw new Error('APPROOV_BASE64URL_SECRET decoded to an empty value.');
    }
    return decoded;
  } catch (err) {
    console.error('[Approov] Required secret is invalid');
    throw new Error('APPROOV_BASE64URL_SECRET must be base64url encoded.');
  }
}

function hashBase64(value) {
  return crypto.createHash('sha256').update(value, 'utf8').digest('base64');
}

function timingSafeEquals(expected, actual) {
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const actualBuffer = Buffer.from(actual, 'utf8');
  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}

function unauthorized(res) {
  res.status(401).json({});
}

function logAuthFailure(err) {
  if (err instanceof ApproovAuthError) {
    console.warn(`[Approov] ${err.code}: ${err.message}`);
    return;
  }
  console.warn('[Approov] Unexpected authentication error.', err);
}

function requestLoggingMiddleware(req, res, next) {
  res.on('finish', () => {
    if (res.statusCode !== 200 && res.statusCode !== 401) {
      return;
    }

    const summary = typeof req.approovSummary === 'string'
      ? req.approovSummary
      : res.statusCode === 401
        ? 'approov_failed:unauthorized'
        : 'request_completed';
    const requiredHeaders = Array.isArray(req.approovRequiredHeaders)
      ? req.approovRequiredHeaders
      : requiredHeadersFor(req.path, approovEnabled, tokenBindingEnabled);
    logRequestCompleted(req, res, summary, requiredHeaders);
  });

  next();
}

function logRequestCompleted(req, res, summary, requiredHeaders) {
  const payload = {
    summary,
    method: req.method,
    path: req.path,
    status: res.statusCode,
    ip: req.ip,
    port: req.socket?.localPort ?? PORT,
    approovEnabled,
    tokenBindingEnabled,
    required_headers: requiredHeaders,
  };
  console.log(`[${formatTimestamp(new Date())}] http.request.completed ${JSON.stringify(payload)}`);
}

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function setApproovFailureSummary(req, err) {
  if (err instanceof ApproovAuthError && hasText(err.code)) {
    req.approovSummary = `approov_failed:${err.code}`;
    return;
  }
  req.approovSummary = 'approov_failed:unexpected_error';
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
  constructor(code, message) {
    super(message);
    this.name = 'ApproovAuthError';
    this.code = code;
  }
}
