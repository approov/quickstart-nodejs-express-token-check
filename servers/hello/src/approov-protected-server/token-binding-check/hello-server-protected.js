const debug = require('debug')('hello-server')
const dotenv = require('dotenv').config()
const { expressjwt: jwt } = require('express-jwt')
const crypto = require('crypto')
const express = require('express')
const cors = require('cors')
const api = express()
api.use(cors())


///////////////////
// LOAD ENV VARS
///////////////////

if (dotenv.error) {
  throw new Error('LOAD ENV VARS: ' + dotenv.error)
}

if (! "APPROOV_BASE64_SECRET" in dotenv.parsed) {
  throw new Error("LOAD ENV VARS: Failed to load APPROOV_BASE64_SECRET. Check it's set in the .env file")
}

const APPROOV_SECRET = Buffer.from(dotenv.parsed.APPROOV_BASE64_SECRET, 'base64')


//////////////////////
// LOGGING CALLBACK
//////////////////////

const logRequest = (req, res, next) => {
  debug('<<< ' + req.method + ' ' + req.originalUrl)

  req.on('end', () => {
    debug('>>> ' + res.statusCode + ' ' + req.method + ' ' + req.originalUrl)
  })

  next()
}


///////////////////////
// APPROOV CALLBACKS
///////////////////////

// Callback that performs the Approov token check using the express-jwt library
const verifyApproovToken = jwt({
  secret: APPROOV_SECRET,
  requestProperty: 'approovTokenDecoded',
  getToken: function fromApproovTokenHeader(req, res) {
    return req.get('Approov-Token')
  },
  algorithms: ['HS256']
})

// Callback to handle the errors occurred while checking the Approov token.
const approovTokenErrorHandler = (err, req, res, next) => {
  // When has an error, it means the header `Approov-Token` is empty, missing or
  // have failed validation of signature, expire time or is malformed.
  // @see verifyApproovToken()
  if (err.name === 'UnauthorizedError') {
    debug("---> Approov token error -> " + err)
    res.status(401)
    res.json({})
    return
  }

  next()
}

// Callback to check the Approov token binding in the header matches with the
// one in the key `pay` of the Approov token claims.
const verifyApproovTokenBinding = (req, res, next) => {

  // The decoded Approov token was added to the request object when the checked
  // it at `verifyApproovToken()`
  token_binding_payload = req.approovTokenDecoded.pay

  if (token_binding_payload === undefined) {
    debug("---> Approov token binding error -> key 'pay' is missing in the claims of the Approov token payload.")
    res.status(401)
    res.json({})
    return
  }

  if (isEmptyString(token_binding_payload)) {
      debug("---> Approov token binding error -> key 'pay' in the decoded token is empty.")
      res.status(401)
      res.json({})
      return
  }

  // We use here the Authorization token, but feel free to use another header,
  // but you need to bind this header to the Approov token in the mobile app.
  const token_binding_header = req.get('Authorization')

  if (isEmptyString(token_binding_header)) {
      debug("---> Approov token binding error -> Missing or empty header to perform the verification for the token binding.")
      res.status(401)
      res.json({})
      return
  }

  // We need to hash and base64 encode the token binding header, because that's
  // how it was included in the Approov token payload claim.
  const token_binding_header_encoded = crypto.createHash('sha256').update(token_binding_header, 'utf-8').digest('base64')

  if (token_binding_payload !== token_binding_header_encoded) {
      debug("---> Approov token error -> token binding in header doesn't match with the key 'pay' in the decoded token.")
      res.status(401)
      res.json({})
      return
  }

  // Let the request continue as usual.
  next()
}


////////////////
// MIDDLEWARE
////////////////

api.use(logRequest)

// Middleware to handle the validation of the Approov token.
api.use(verifyApproovToken)
api.use(approovTokenErrorHandler)
api.use(verifyApproovTokenBinding)


////////////////
// ENDPOINTS
////////////////

// simple 'hello world' endpoint.
api.get('/', function (req, res, next) {
  res.json({
    message: "Hello, World!",
  })
})


////////////
// SERVER
////////////

// Create and run the HTTP server
api.listen(8002, function () {
  debug("Server listening on %s", "localhost")
})


/////////////
// HELPERS
/////////////

const isEmpty = function(value) {
  return  (value === undefined) || (value === null) || (value === '')
}

const isString = function(value) {
  return (typeof(value) === 'string')
}

const isEmptyString = function(value) {
  return (isEmpty(value) === true) || (isString(value) === false) ||  (value.trim() === '')
}
