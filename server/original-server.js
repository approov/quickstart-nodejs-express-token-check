const debug = require('debug')('original-server')
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

