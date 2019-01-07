const jwt = require('jsonwebtoken')

const args = require('minimist')(process.argv.slice(2))

let data = {
  data: 'foobar'
}

let secret = 'approov-base64-encoded-secret'

let expiresIn = '1h'

if (args['expires-in']) {
    expiresIn = args['expires-in']
}

if (args['secret']) {
    secret = args['secret']
}

if (args['data']) {
    data = args['data']
}

console.log('DATA: %O', data)
console.log('EXPIRES IN: %s', expiresIn)
console.log('SECRET: %s', secret)

const token = jwt.sign(data, secret, { expiresIn: expiresIn })

console.log('BASE64 ENCODED SECRET: %s', Buffer.from(secret).toString('base64'))
console.log('TOKEN: %O', token)
