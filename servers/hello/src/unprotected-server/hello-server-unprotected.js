const debug = require('debug')('hello-server')
const express = require('express')
const cors = require('cors')
const api = express()
api.use(cors())


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


////////////////
// MIDDLEWARE
////////////////

api.use(logRequest)


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
