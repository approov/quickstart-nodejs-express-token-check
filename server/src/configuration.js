require('dotenv').config()

const httpProtocol = process.env.HTTP_PROTOCOL || 'https'
const hostName = process.env.SERVER_HOSTNAME || 'localhost'
const httpPort = process.env.HTTP_PORT || '3000'
const url = httpProtocol + '://' + hostName
const certificatesPath = process.env.CERTIFICATES_PATH || "/home/node/.ssl"

const server = {
  hostName: hostName,
  httpProtocol: httpProtocol,
  httpPort: httpPort,
  url: url,
  fullUrl: url + ':' + httpPort,
  httpsEnabled: (httpProtocol === 'https'),
  certificateKey: certificatesPath + "/" + hostName + ".key",
  certificatePem: certificatesPath + "/" + hostName + ".pem"
}

module.exports = {
  server
}
