const dbg = require('debug')('server')
const debug = dbg.extend('middleware-custom-callbacks')
const dbgv = require('debug')('server-verbose')
const debugVerbose = dbgv.extend('middleware-custom-callbacks')

function checkToken(approov) {
    const configErrorCallback = function(exception) {
      debug('Approov config failed validation: ' + exception.message)
      debugVerbose('Approov Config Exception: %O', exception)
    }

    const jwtCheckResultCallback = function(result, req, res, next) {
      debug(res.approov.debug.message, 'Approov Token failed validation')
      debugVerbose('Result: %O', result)
      next()
    }

    return approov.middlewareCustomCallbacks.checkToken(approov.config, configErrorCallback, jwtCheckResultCallback)
}

module.exports = {
  checkToken
}
