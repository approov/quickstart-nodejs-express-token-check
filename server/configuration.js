const debug = require('debug')('approov-protected-server')
const dotenv = require('dotenv').config()

if (dotenv.error) {
  debug('FAILED TO PARSE `.env` FILE | ' + dotenv.error)
}


/////////////////////////
/// SERVER ENVIRONMENT
////////////////////////

const env = dotenv.parsed.ENV || 'production'
const httpProtocol = dotenv.parsed.HTTP_PROTOCOL || 'http'
const hostName = dotenv.parsed.SERVER_HOSTNAME || 'localhost'
const httpPort = dotenv.parsed.HTTP_PORT || '5000'
const url = httpProtocol + '://' + hostName
const certificatesPath = dotenv.parsed.CERTIFICATES_PATH || "/home/node/.ssl"

const fullUrl = function(env, url, port) {

  if (env === 'production') {
    return url
  }

  return url + ':' + port
}

if (env !== 'production') {

}

const server = {
  env: env,
  hostName: hostName,
  httpProtocol: httpProtocol,
  httpPort: httpPort,
  url: url,
  fullUrl: fullUrl(env, url, httpPort),
  httpsEnabled: (httpProtocol === 'https'),
  certificateKey: certificatesPath + "/" + hostName + ".key",
  certificatePem: certificatesPath + "/" + hostName + ".pem"
}


///////////////////////////
/// APPROOV ENVIRONMENT
//////////////////////////

let isToAbortRequestOnInvalidToken = true
let isToAbortOnInvalidBinding = true
let isApproovLoggingEnabled = true
const abortRequestOnInvalidToken = dotenv.parsed.APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN || 'true'
const abortOnInvalidTokenBinding = dotenv.parsed.APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN_BINDING || 'true'
const approovLoggingEnabled = dotenv.parsed.APPROOV_LOGGING_ENABLED || 'true'

if (abortRequestOnInvalidToken.toLowerCase() === 'false') {
  isToAbortRequestOnInvalidToken = false
}

if (abortOnInvalidTokenBinding.toLowerCase() === 'false') {
  isToAbortOnInvalidBinding = false
}

if (approovLoggingEnabled.toLowerCase() === 'false') {
  isApproovLoggingEnabled = false
}

const approov = {
  abortRequestOnInvalidToken: isToAbortRequestOnInvalidToken,
  abortRequestOnInvalidTokenBinding: isToAbortOnInvalidBinding,
  approovLoggingEnabled: isApproovLoggingEnabled,

  // The Approov base64 secret must be retrieved with the Approov CLI tool
  base64Secret: dotenv.parsed.APPROOV_BASE64_SECRET,
}


////////////////////////////
/// EXPORT CONFIGURATION
///////////////////////////

module.exports = {
  server,
  approov,
}
