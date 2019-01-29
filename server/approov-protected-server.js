const debug = require('debug')('approov-protected-server')
const jwt = require('express-jwt')
const crypto = require('crypto')
const config = require('./configuration')
const https = require('https')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())


////////////////
/// FUNCTIONS
////////////////

const buildLogMessagePrefix = function(req, res) {
  return res.statusCode + ' ' + req.method + ' ' + req.originalUrl
}

const logResponseToRequest = function(req, res) {
  debug(buildLogMessagePrefix(req, res))
}

const getRandomShapeResponse = function() {
  const shapes = [
    'Circle',
    'Triangle',
    'Square',
    'Rectangle'
  ]
  return {"shape": shapes[Math.floor((Math.random() * shapes.length))]}
}

const getRandomFormResponse = function() {
  const forms = [
    'Sphere',
    'Cone',
    'Cube',
    'Box'
  ]
  return {"form": forms[Math.floor((Math.random() * forms.length))]}
}

/////////////////////////////////
/// STARTS APPROOV INTEGRATION
////////////////////////////////

////// APPROOV HELPER FUNCTIONS //////

const isEmpty = function(value) {
  return  (value === undefined) || (value === null) || (value === '')
}

const isString = function(value) {
  return (typeof(value) === 'string')
}

const isEmptyString = function(value) {
  return (isEmpty(value) === true) || (isString(value) === false) ||  (value.trim() === '')
}

const logApproov = function(req, res, message) {
    debug(buildLogMessagePrefix(req, res) + ' ' + message)
}

////// APPROOV TOKEN //////

// callback that performs the Approov token check using the express-jwt library
const checkApproovToken = jwt({
  secret: Buffer.from(config.approov.base64Secret, 'base64'), // decodes the Approov secret
  requestProperty: 'approovTokenDecoded',
  getToken: function fromApproovTokenHeader(req) {
    return req.get('approov-token')
  },
  algorithms: ['HS256']
})

// callback to handle the errors occurred while checking the Approov token.
const handlesApproovTokenError = function(err, req, res, next) {

  message = 'REQUEST WITH INVALID APPROOV TOKEN'

  if (err.name === 'UnauthorizedError') {
    message = message + ' | ' + err
  }

  // rejects the request with 400 response when approov is enabled, otherwise
  // will let the request to continue as usual.
  if (err.name === 'UnauthorizedError' && config.approov.abortRequestOnInvalidToken === true) {
    logApproov(req, res, 'REJECTED ' + message)
    res.status(400).json({})
    return
  }

  logApproov(req, res, 'ACCEPTED ' + message)

  next()
}

// handles when an Approov token is successfully validated.
const handlesApproovTokenSuccess = function(req, res, next) {
  logApproov(req, res, 'ACCEPTED REQUEST WITH VALID APPROOV TOKEN')
  next()
}


////// CUSTOM PAYLOAD CLAIN IN THE APPROOV TOKEN //////

// validates if the Approov contains the same claim has in the request
const isValidCustomPayloadClaim = function(approovTokenDecoded, claimValue) {

  if (isString(approovTokenDecoded)) {
    return false
  }

  // checking if the approov token contains a custom payload claim and verify it.
  if (! isEmptyString(approovTokenDecoded.pay)) {

    // decodes the base64 custom payload claim hash into an hexadecimal string
    const payloadClaimBase64Hash = approovTokenDecoded.pay
    const payloadClaimHash = Buffer.from(payloadClaimBase64Hash, 'base64').toString('hex')

    const claimValueHash = crypto.createHash('sha256').update(claimValue, 'utf-8').digest('hex')

    return payloadClaimHash === claimValueHash
  }

  // The Approov failover running in the Google cloud doesn't return the custom
  // payload claim, thus we always need to have a pass when is not present.
  return true
}

// callback to check if the custom payload claim in an Approov token matches the
// claim in the request
const checkApproovTokenCustomPayloadClaim = function(req, res, next){

  let message = 'REQUEST WITH VALID CUSTOM PAYLOAD CLAIM IN THE APPROOV TOKEN'

  const claimValue = req.get('oauth2-token')

  if (isEmptyString(claimValue)) {
    return logApproov(req, res, 'REJECTED REQUEST WITHOUT PAYLOAD CLAIM VALUE')
  }

  const isValidClaim = isValidCustomPayloadClaim(req.approovTokenDecoded, claimValue)

  if (isValidClaim === false) {
    message = 'REQUEST WITH INVALID CUSTOM PAYLOAD CLAIM IN THE APPROOV TOKEN'
  }

  if (isValidClaim === false && config.approov.abortRequestOnInvalidCustomPayloadClaim === true) {
    message = 'REJECTED ' + message
    res.status(400).json({})
  } else {
    message = 'ACCEPTED ' + message
    next()
  }

  logApproov(req, res, message)
}

/////// THE APPROOV INTERCEPTORS ///////

// Intercepts all calls to the shapes endpoint to validate the Approov token.
app.use('/shapes', checkApproovToken)

// Handles failure in validating the Approov token
app.use('/shapes', handlesApproovTokenError)

// Handles requests where the Approov token is a valid one.
app.use('/shapes', handlesApproovTokenSuccess)

// Intercepts all calls to the forms endpoint to validate the Approov token.
app.use('/forms', checkApproovToken)

// Handles failure in validating the Approov token
app.use('/forms', handlesApproovTokenError)

// Handles requests where the Approov token is a valid one.
app.use('/forms', handlesApproovTokenSuccess)

// checks if the custom payload claim is present in the Approov token and
// matches the claim used by the mobile app, that in this case we decided to be
// the ouath2 token, but you may want to use another type of claim.
app.use('/forms', checkApproovTokenCustomPayloadClaim)

///////////////////////////////
/// ENDS APPOOV INTEGRATION
//////////////////////////////

////////////////
// ENDPOINTS
////////////////

// the index endpoint
app.get('/', function(req, res, next) {
  const links = {
    hello: config.server.fullUrl + "/hello",
    shapes: config.server.fullUrl + "/shapes",
    forms: config.server.fullUrl + "/forms",
  }
  logResponseToRequest(req, res)
  res.status(200).json(links)
})

// simple 'hello world' endpoint.
app.get('/hello', function (req, res, next) {
  logResponseToRequest(req, res)
  res.json({ text: "Hello World!" })
})

// shapes endpoint returns a random shape.
app.get('/shapes', function(req, res, next) {
  res.json(getRandomShapeResponse())
})

// shapes endpoint returns a random form.
app.get('/forms', function(req, res, next) {
  res.json(getRandomFormResponse())
})


////////////
// SERVER
////////////

if (config.server.httpsEnabled) {
  // Load the certificate and key data for our server to be hosted over HTTPS
  const serverOptions = {
    key: fs.readFileSync(config.server.certificateKey),
    cert: fs.readFileSync(config.server.certificatePem),
    requestCert: false,
    rejectUnauthorized: false
  }

  // Create and run the HTTPS server
  https.createServer(serverOptions, app).listen(config.server.httpPort, function() {
    debug("Shapes server listening on %s", config.server.fullUrl)
  })

} else {

  // Create and run the HTTP server
  app.listen(config.server.httpPort, function () {
    debug("Shapes server listening on %s", config.server.fullUrl)
  })
}

