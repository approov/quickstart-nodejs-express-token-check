const dbg = require('debug')('server')
const debug = dbg.extend('router')
const dbgv = require('debug')('server-verbose')
const debugVerbose = dbgv.extend('router')

const server = require('./configuration').server
const middleware = require('./middleware')
//const middleware = require('./middleware-custom-callbacks')

const approov = require('approov-token-check')

function paths(app) {

  app.get('/', function(req, res) {
    debug(req.method + ' ' + req.url)

    const links = {
      home: server.fullUrl,
      hello: server.fullUrl + "/hello",
      shapes: server.fullUrl + "/shapes"
    }

    res.status(200).json(links)
  })

  // simple 'hello world' endpoint.
  app.get('/hello', function (req, res) {
    debug(req.method + ' ' + req.url)
    res.json({ text: "Hello World!" })
  })

  // All routes paths from here will be intercepted to validate the Approov token
  app.use('/', middleware.checkToken(approov))

  // 'shapes' endpoint returns a random shape selected from the following list.
  const shapes = [
    'Circle',
    'Triangle',
    'Square',
    'Rectangle'
  ]

  app.get('/shapes', function(req, res) {
    const randomShape = shapes[Math.floor((Math.random() * shapes.length))]
    debug(req.method + ' ' + req.url + ' | shape: ' + randomShape + res.approov.debug.codeText)
    res.json({ shape: randomShape })
  })
}

module.exports = {
  paths
}
