const express = require('express')
const cors = require('cors')
const app = express()
app.use(cors())

const server = require('./server')
const router = require('./router')

server.boot(app)
router.paths(app)
