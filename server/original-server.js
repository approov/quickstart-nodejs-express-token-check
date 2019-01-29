const debug = require('debug')('original-server')
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
  logResponseToRequest(req, res)
  res.json(getRandomShapeResponse())
})

// shapes endpoint returns a random form.
app.get('/forms', function(req, res, next) {
  logResponseToRequest(req, res)
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

