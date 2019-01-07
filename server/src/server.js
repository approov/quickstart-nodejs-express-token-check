const debug = require('debug')('server')
const debugVerbose = require('debug')('server-verbose')

const server = require('./configuration').server

const https = require('https')
const fs = require('fs')

function boot(app) {

  if (server.httpsEnabled) {

    // Load the certificate and key data for our server to be hosted over HTTPS
    const serverOptions = {
      key: fs.readFileSync(server.certificateKey),
      cert: fs.readFileSync(server.certificatePem),
      requestCert: false,
      rejectUnauthorized: false
    }

    debugVerbose(serverOptions)

    // Create and run the HTTPS server
    https.createServer(serverOptions, app).listen(server.httpPort, function() {
      debug("Shapes server listening on " + server.fullUrl)
    })

  } else {

    // Create and run the HTTP server
    app.listen(server.httpPort, function () {
      debug("Shapes server listening on " + server.fullUrl)
    })
  }
}

module.exports = {
  boot
}
