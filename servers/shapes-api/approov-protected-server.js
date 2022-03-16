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

const buildHelloWorldResponse = function(res) {
  res.json({
    text: "Hello, World!",
  })
}

const buildShapesResponse = function(res, protectionStatus) {
  const response = getRandomShapeResponse()
  res.json(response)
}

const buildFormsResponse = function(res, protectionStatus) {
  const response = getRandomFormResponse()
  res.json(response)
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

// Callback to be personalized in order to get the token binding header value being used by
// your application.
// In the current scenario we use an Authorization token, but feel free to use what
// suits best your needs.
const getTokenBindingHeader = function(req) {
  return req.get('Authorization')
}

// Callback to be customized with how you want to handle a request with an
// invalid Approov token.
// The code included in this callback is provided as an example, that you can
// keep or totally change it in a way that best suits your needs.
const handlesRequestWithInvalidApproovToken = function(err, req, res, next, httpStatusCode) {

  logApproov(req, res, 'APPROOV TOKEN: ' + err)

  // Logging a message to make clear in the logs what was the action we took.
  // Feel free to skip it if you think is not necessary to your use case.
  let message = 'REQUEST WITH INVALID APPROOV TOKEN'

  if (config.approov.abortRequestOnInvalidToken === true) {
    buildBadRequestResponse(req, res, httpStatusCode, 'REJECTED ' + message)
    return
  }

  message = 'ACCEPTED ' + message
  logApproov(req, res, message)
  next()
  return
}

// Callback to be customized with how you want to handle a request where the
// token binding in the request header doesn't match the the one in the Approov token.
// The code included in this callback is provided as an example, that you can
// keep or totally change it in a way that best suits your needs.
const handlesRequestWithInvalidTokenBinding = function(req, res, next, httpStatusCode, message) {

  logApproov(req, res, message)

  // Logging here to make clear in the logs what was the action we took.
  // Feel free to skip it if you think is not necessary to your use case.
  let logMessage = 'REQUEST WITH INVALID APPROOV TOKEN BINDING'

  if (config.approov.abortRequestOnInvalidTokenBinding === true) {
    buildBadRequestResponse(req, res, httpStatusCode, 'REJECTED ' + logMessage)
    return
  }

  logApproov(req, res, 'ACCEPTED ' + logMessage)
  next()
  return
}

// Callback to build the response when a request fails to pass the Approov checks.
const buildBadRequestResponse = function(req, res, httpStatusCode, logMessage) {
  res.status(httpStatusCode)
  logApproov(req, res, logMessage)
  res.json({})
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
  getToken: function fromApproovTokenHeader(req, res) {
    req.approovTokenError = false
    const approovToken = req.get('Approov-Token')

    if (isEmptyString(approovToken)) {
      req.approovTokenError = true
      throw new Error('token empty or missing in the header of the request.')
    }

    return approovToken
  },
  algorithms: ['HS256']
})

// Callback to handle the errors occurred while checking the Approov token.
const handlesApproovTokenError = function(err, req, res, next) {

  if (req.approovTokenError === true) {
    // When we reach here, it means the header `Approov-Token` is empty or is missing.
    // @see checkApproovToken()
    handlesRequestWithInvalidApproovToken(err, req, res, next, 400)
    return
  }

  if (err.name === 'UnauthorizedError') {
    // When we reach here, it means that an Error was thrown by the express-jwt
    // library while decoding the Approov token.
    // @see checkApproovToken()
    req.approovTokenError = true
    handlesRequestWithInvalidApproovToken(err, req, res, next, 401)
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


////// APPROOV TOKEN BINDING //////


// Callback to check the Approov token binding in the header matches with the one in the key `pay` of the Approov token claims.
const handlesApproovTokenBindingVerification = function(req, res, next){

  if (req.approovTokenError === true) {
    next()
    return
  }

  // The decoded Approov token was added to the request object when the checked it at `checkApproovToken()`
  token_binding_payload = req.approovTokenDecoded.pay

  if (token_binding_payload === undefined) {
    handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING ERROR: key 'pay' is missing in the claims of the Approov token payload.")
    return
  }

  if (isEmptyString(token_binding_payload)) {
      handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING ERROR: key 'pay' in the decoded token is empty.")
      return
  }

  // We use here the Authorization token, but feel free to use another header, but you need to bind this  header to
  // the Approov token in the mobile app.
  const token_binding_header = getTokenBindingHeader(req)

  if (isEmptyString(token_binding_header)) {
      handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING ERROR: Missing or empty header to perform the verification for the token binding.")
      return
  }

  // We need to hash and base64 encode the token binding header, because that's how it was included in the Approov
  // token on the mobile app.
  const token_binding_header_encoded = crypto.createHash('sha256').update(token_binding_header, 'utf-8').digest('base64')

  if (token_binding_payload !== token_binding_header_encoded) {
      handlesRequestWithInvalidTokenBinding(req, res, next, 401, "APPROOV TOKEN BINDING ERROR: token binding in header doesn't match with the key 'pay' in the decoded token.")
      return
  }

  logApproov(req, res, 'ACCEPTED REQUEST WITH VALID APPROOV TOKEN BINDING')

  // Let the request continue as usual.
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

// Checks if the Approov token binding is valid and aborts the request when the environment variable
// APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN_BINDING is set to true in the environment file.
app.use('/v2/forms', handlesApproovTokenBindingVerification)

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

/**
 * V1 ENDPOINTS
 */

// simple 'hello world' endpoint.
app.get('/v1/hello', function (req, res, next) {
  logResponseToRequest(req, res)
  buildHelloWorldResponse(res)
})

// shapes endpoint returns a random shape.
app.get('/v1/shapes', function(req, res, next) {
  logResponseToRequest(req, res)
  buildShapesResponse(res, 'unprotected')
})

// shapes endpoint returns a random form.
app.get('/v1/forms', function(req, res, next) {
  logResponseToRequest(req, res)
  buildFormsResponse(res, 'unprotected')
})

/**
 * V2 ENDPOINTS
 */

// simple 'hello world' endpoint.
app.get('/v2/hello', function (req, res, next) {
  logResponseToRequest(req, res)
  buildHelloWorldResponse(res)
})

// shapes endpoint returns a random shape.
app.get('/v2/shapes', function(req, res, next) {
  logResponseToRequest(req, res)
  buildShapesResponse(res, 'protected')
})

// shapes endpoint returns a random form.
app.get('/v2/forms', function(req, res, next) {
  logResponseToRequest(req, res)
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
