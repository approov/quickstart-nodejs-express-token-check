//const chalk = require('chalk')
const debug = require('debug')('http')

const express = require('express')
const https = require('https')
const cors = require('cors')
const fs = require('fs')
const approovTokenChecker = require('NodeJS-Token-Check')

const config = require('./configuration').config
const server = config.server
const approov = config.approov

const HOST_NAME = server.hostName
const HTTP_PORT = server.httpPort
const HTTP_PROTOCOL = server.httpProtocol
const URL = HTTP_PROTOCOL + '://' + HOST_NAME
const FULL_URL = URL + ":" + HTTP_PORT
const CERTIFICATES_PATH = server.certificatesPath

const app = express()
app.use(cors())

app.get('/', function(req, res) {
  debug(req.method + ' ' + req.url)

  links = {
    home: FULL_URL,
    hello: FULL_URL + "/hello",
    shapes: FULL_URL + "/shapes"
  }

  res.status(200).json(links)
})

// simple 'hello world' endpoint.
app.get('/hello', function (req, res) {
  debug(req.method + ' ' + req.url)
  res.json({ text: "Hello World!" })
})

// use the Approov token checker to protect all subsequent endpoints
var tokenHeader = 'approov-token'
var base64Secret = approov.tokenSecret

const argumentsErrorsCallback = function(exception){
  debug(exception)
}

app.use('/', approovTokenChecker(base64Secret, approov.isToAbortRequest, argumentsErrorsCallback))

// 'shapes' endpoint returns a random shape selected from the following list.
var shape_array = ['Circle','Triangle','Square','Rectangle']
app.get('/shapes', function(req, res) {
  debug(req.method + ' ' + req.url)
  var rnd_shape = shape_array[Math.floor((Math.random() * shape_array.length))]
  debug('shape: %o', rnd_shape)
  res.json({ shape: rnd_shape })
})

if (HTTP_PROTOCOL === 'https') {

  // Load the certificate and key data for our server to be hosted over HTTPS
  var serverOptions = {
    key: fs.readFileSync(CERTIFICATES_PATH + "/" + HOST_NAME + ".key"),
    cert: fs.readFileSync(CERTIFICATES_PATH + "/" + HOST_NAME + ".pem"),
    requestCert: false,
    rejectUnauthorized: false
  }

  // Create and run the HTTPS server
  https.createServer(serverOptions, app).listen(HTTP_PORT, function() {
    debug("Shapes server listening on " + FULL_URL)
  })

} else {

  // Create and run the HTTP server
  app.listen(HTTP_PORT, function () {
    debug("Shapes server listening on " + FULL_URL)
  })
}
