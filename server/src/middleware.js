function checkToken(approov) {
    return approov.middleware.checkToken(approov.config)
}

module.exports = {
  checkToken
}
