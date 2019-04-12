#!/usr/bin/env node

const help = `
GENERATE APPROOV TOKEN CLI

To be used only to generate Approov tokens for testing purposes during development.

Usage:
    generate-token.js
    generate-token.js [--expire EXPIRE] [--claim CLAIM] [--secret SECRET]

Options:
    --expire   EXPIRE  The Approov token expire time in minutes [default: 5].
    --claim    CLAIM   The base64 encode sha256 hash of the custom payload claim for the Approov token.
    --claim-example    Same as --claim but using an hard-coded claim example.
    --secret   SECRET  The base64 encoded secret to sign the Approov token for test purposes.
    -h --help          Show this screen.
`
const jwt = require('jsonwebtoken')

const args = require('minimist')(process.argv.slice(2))

const claimExample = 'f3U2fniBJVE04Tdecj0d6orV9qT9t52TjfHxdUqDBgY='

const debug = require('debug')('approov-protected-server')
const dotenv = require('dotenv').config()

if (dotenv.error) {
  debug('FAILED TO PARSE `.env` FILE | ' + dotenv.error)
}

let data = {}

let secret = Buffer.from(dotenv.parsed.APPROOV_BASE64_SECRET, 'base64')

let expiresIn = '5m'

if (args['h'] || args['help']) {
  console.log(help)
  process.exit()
}

if (args['secret']) {
    secret = args['secret']
}

if (args['expire']) {
    expiresIn = args['expire']
}

if (args['claim']) {
    data.pay = args['claim']
}

if (args['claim-example']) {
    data.pay = claimExample
}

const token = jwt.sign(data, secret, { expiresIn: expiresIn })

console.log('Token: \n %O', token)
