const debug = require('debug')('hello-server')
const dotenv = require('dotenv').config()
const jwt = require('express-jwt')
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


////////////////
// MIDDLEWARE
////////////////

api.use(logRequest)

// Middleware to handle the validation of the Approov token.
api.use(verifyApproovToken)
api.use(approovTokenErrorHandler)


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
