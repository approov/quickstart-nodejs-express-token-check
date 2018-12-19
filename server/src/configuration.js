require('dotenv').config()

var isToAbortRequest = true

const abortRequest = process.env.APPROOV_ABORT_REQUEST || 'false'

if (abortRequest.toLowerCase() === 'false') {
    isToAbortRequest = false
}

var config = {
    approov: {
        isToAbortRequest: isToAbortRequest,
        tokenSecret: process.env.APPROOV_TOKEN_SECRET,
    },
    server: {
        hostName: process.env.SERVER_HOSTNAME || 'localhost',
        httpProtocol: process.env.HTTP_PROTOCOL || 'https',
        httpPort: process.env.HTTP_PORT || '3443',
        certificatesPath: process.env.CERTIFICATES_PATH || "/home/node/.ssl"
    }
}


module.exports = {
    config
}
