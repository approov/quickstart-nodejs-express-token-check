const debug = require('debug')('approov-protected-server')
const jwt = require('express-jwt')
const crypto = require('crypto')
const config = require('./configuration')
const https = require('https')
const fs = require('fs')
const express = require('express')
const cors = require('cors')
const path = require('path')
const app = express()
app.use(cors())

const BAD_REQUEST_RESPONSE = {
  status: "Bad Request"
}

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
  return {
    shape: shapes[Math.floor((Math.random() * shapes.length))]
  }
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


////////////////////////////////////////////////////////////////////////////////
/// YOUR APPLICATION CUSTOMIZABLE CALLBACKS FOR THE APPROOV INTEGRATION
////////////////////////////////////////////////////////////////////////////////
///
/// Feel free to customize this callbacks to best suite the needs your needs.
///

// Callback to be customized with your preferred way of logging.
const logApproov = function(req, res, message) {
    debug(buildLogMessagePrefix(req, res) + ' ' + message)
}

// Callback to be personalized in order to get the claim value being used by
// your application.
// In the current scenario we use an Oauth2 token, but feel free to use what
// suits best your needs.
const getClaimValueFromRequest = function(req) {
  return req.get('Authorization')
}

// Callback to be customized with how you want to handle a request with an
// invalid Approov token.
// The code included in this callback is provided as an example, that you can
// keep or totally change it in a way that best suits your needs.
const handlesRequestWithInvalidApproovToken = function(err, req, res, next) {

  // Logging a message to make clear in the logs what was the action we took.
  // Feel free to skip it if you think is not necessary to your use case.
  let message = 'REQUEST WITH INVALID APPROOV TOKEN'

  if (config.approov.abortRequestOnInvalidToken === true) {
    message = 'REJECTED ' + message
    res.status(400)
    logApproov(req, res, message)
    res.json(BAD_REQUEST_RESPONSE)
    return
  }

  message = 'ACCEPTED ' + message
  logApproov(req, res, message)
  next()
  return
}

// Callback to be customized with how you want to handle a request where the
// claim in the request doesn't match the custom payload claim in the Approov
// token.
// The code included in this callback is provided as an example, that you can
// keep or totally change it in a way that best suits your needs.
const handlesRequestWithInvalidClaimValue = function(req, res, next) {

  // Logging here to make clear in the logs what was the action we took.
  // Fseel free to skip it if you think is not necessary to your use case.
  let message = 'REQUEST WITH INVALID CLAIM VALUE'

  if (config.approov.abortRequestOnInvalidCustomPayloadClaim === true) {
    message = 'REJECTED ' + message
    res.status(400)
    logApproov(req, res, message)

    res.json(BAD_REQUEST_RESPONSE)

    return
  }

  message = 'ACCEPTED ' + message
  logApproov(req, res, message)
  next()
  return
}


////////////////////////////////////////////////////////////////////////////////
/// STARTS NON CUSTOMIZABLE LOGIC FOR THE APPROOV INTEGRATION
////////////////////////////////////////////////////////////////////////////////
///
/// This section contains code that is specific to the Approov integration,
/// thus we think that is not necessary to customize it, once is not
/// interfering with your application logic or behavior.
///

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


////// APPROOV TOKEN //////


// Callback that performs the Approov token check using the express-jwt library
const checkApproovToken = jwt({
  secret: Buffer.from(config.approov.base64Secret, 'base64'), // decodes the Approov secret
  requestProperty: 'approovTokenDecoded',
  getToken: function fromApproovTokenHeader(req) {
    req.approovTokenError = false
    return req.get('approov-token')
  },
  algorithms: ['HS256']
})

// Callback to handle the errors occurred while checking the Approov token.
const handlesApproovTokenError = function(err, req, res, next) {

  if (err.name === 'UnauthorizedError') {
    message = 'APPROOV TOKEN ERROR: ' + err
    logApproov(req, res, message)

    req.approovTokenError = true
    handlesRequestWithInvalidApproovToken(err, req, res, next)
    return
  }

  next()
  return
}

// Callback to handles when an Approov token is successfully validated.
const handlesApproovTokenSuccess = function(req, res, next) {
    if (req.approovTokenError === false) {
      logApproov(req, res, 'ACCEPTED REQUEST WITH VALID APPROOV TOKEN')
    }

    next()
    return
}


////// CUSTOM PAYLOAD CLAIM IN THE APPROOV TOKEN //////


// Validates if the Approov contains the same claim has in the request
const isClaimValueInRequestValid = function(requestClaimValue, approovTokenDecoded) {

  if (isEmptyString(requestClaimValue)) {
    return false
  }

  if (isEmpty(approovTokenDecoded)) {
    return false
  }

  // checking if the approov token contains a custom payload claim and verify it.
  if (! isEmptyString(approovTokenDecoded.pay)) {

    const requestBase64ClaimValueHash = crypto.createHash('sha256').update(requestClaimValue, 'utf-8').digest('base64')

    return approovTokenDecoded.pay === requestBase64ClaimValueHash
  }

  // The Approov failover running in the Google cloud doesn't return the custom
  // payload claim, thus we always need to have a pass when is not present.
  return true
}

// Callback to check if the custom payload claim in an Approov token matches the
// claim in the request
const checkApproovTokenCustomPayloadClaim = function(req, res, next){

  if (req.approovTokenError === true) {
    next()
    return
  }

  let message = 'REQUEST WITH VALID CLAIM VALUE'

  const requestClaimValue = getClaimValueFromRequest(req)

  if (isEmptyString(requestClaimValue)) {
    message = 'REQUEST WITHOUT A CLAIM VALUE'
    handlesRequestWithInvalidClaimValue(req, res, next)
    return
  }

  // checks if the claim from the request matches the custom payload claim in
  // the Approov token.
  const isValidClaim = isClaimValueInRequestValid(requestClaimValue, req.approovTokenDecoded)

  if (isValidClaim === false) {
    message = 'REQUEST WITH CLAIM VALUE NOT MATCHING THE CUSTOM PAYLOAD CLAIM IN THE APPROOV TOKEN'
    logApproov(req, res, message)
    handlesRequestWithInvalidClaimValue(req, res, next)
    return
  }


  message = 'ACCEPTED ' + message
  logApproov(req, res, message)
  next()
  return
}

/////// THE APPROOV INTERCEPTORS ///////

// Intercepts all calls to the shapes endpoint to validate the Approov token.
app.use('/v2/shapes', checkApproovToken)

// Handles failure in validating the Approov token
app.use('/v2/shapes', handlesApproovTokenError)

// Handles requests where the Approov token is a valid one.
app.use('/v2/shapes', handlesApproovTokenSuccess)

// Intercepts all calls to the forms endpoint to validate the Approov token.
app.use('/v2/forms', checkApproovToken)

// Handles failure in validating the Approov token
app.use('/v2/forms', handlesApproovTokenError)

// Handles requests where the Approov token is a valid one.
app.use('/v2/forms', handlesApproovTokenSuccess)

// checks if the custom payload claim is present in the Approov token and
// matches the claim used by the mobile app, that in this case we decided to be
// the ouath2 token, but you may want to use another type of claim.
app.use('/v2/forms', checkApproovTokenCustomPayloadClaim)

/// NOTE:
///   Is important to place all the Approov interceptors before we declare the
///   endpoints of the API, otherwise they will not be able to intercept any
///   request.

////////////////////////////////////////////////////////////////////////////////
/// ENDS APPOOV INTEGRATION
////////////////////////////////////////////////////////////////////////////////

////////////////
// ENDPOINTS
////////////////

const buildHelloWorldResponse = function(res) {
  res.json({
    text: "Hello, World!",
    status: "Hello, World! (healthy)"
  })
}

const buildShapesResponse = function(res, protectionStatus) {
  const response = getRandomShapeResponse()
  response.status =  response.shape + ` (${protectionStatus})`
  res.json(response)
}

const buildFormsResponse = function(res, protectionStatus) {
  const response = getRandomFormResponse()
  response.status =  response.form + ` (${protectionStatus})`
  res.json(response)
}

/**
 * V0 ENDPOINTS
 */

// the index endpoint
app.get('/', function(req, res, next) {
  logResponseToRequest(req, res)
  res.sendFile(path.join(__dirname + '/index.html'));
})

// simple 'hello world' endpoint.
app.get('/hello', function (req, res, next) {
  logResponseToRequest(req, res)
  res.send("Hello, World!")
})

// shapes endpoint returns a random shape.
app.get('/shapes', function(req, res, next) {
  res.json(getRandomShapeResponse())
})

// shapes endpoint returns a random form.
app.get('/forms', function(req, res, next) {
  res.json(getRandomFormResponse())
})


/**
 * V1 ENDPOINTS
 */

// simple 'hello world' endpoint.
app.get('/v1/hello', function (req, res, next) {
  buildHelloWorldResponse(res)
})

// shapes endpoint returns a random shape.
app.get('/v1/shapes', function(req, res, next) {
  buildShapesResponse(res, 'unprotected')
})

// shapes endpoint returns a random form.
app.get('/v1/forms', function(req, res, next) {
  buildFormsResponse(res, 'unprotected')
})


/**
 * V2 ENDPOINTS
 */

// simple 'hello world' endpoint.
app.get('/v2/hello', function (req, res, next) {
  buildHelloWorldResponse(res)
})

// shapes endpoint returns a random shape.
app.get('/v2/shapes', function(req, res, next) {
  buildShapesResponse(res, 'protected')
})

// shapes endpoint returns a random form.
app.get('/v2/forms', function(req, res, next) {
  buildFormsResponse(res, 'protected')
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

