# QUICK START GUIDE

Only 2 lines of code needed to integrate Approov in your NodeJS Express API server:

```js
const approov = require('approov-token-check')

// All endpoints declared from here will be intercepted to validate the Approov token
app.use('/', approov.middleware.checkToken(approov.config))
```

Let's walk you through a more detailed example...

## INSTALL

Require the NPM Approov Token Check package:

```bash
npm install --save approov-token-check
```

## HOW TO USE

### With the Approov Middleware

On the top of your router file require it:

```js

// your code here...

const approov = require('approov-token-check')

// your code here...

app.get('/unprotected-by-approov', function (req, res) {
    res.json({ text: "This endpoint is not protected by an Approov token!!!"})
})

// All endpoints declared from here will be intercepted to validate the Approov token
app.use('/', approov.middleware.checkToken(approov.config))

app.get('/protected-by-approov', function (req, res) {
    res.json({ text: "This endpoint is protected by an Approov token!!!"})
})

app.get('/another-one-protected-by-approov', function (req, res) {
    res.json({ text: "This is another endpoint that is protected by an Approov token!!!"})
})

// your code here...

```
> similar to this approach used on the Approov Shapes Demo Server.

### With a Custom Middleware

On the top of your router file require it:

```js

// your code here...

const approov = require('approov-token-check')

// your code here...

// START - APPROOV CALLBACKS

const configErrorCallback = function(exception) {
  // maybe logging the exception and return a 400 response???
}

const jwtCheckResultCallback = function(result, req, res, next) {

  // Only to handle failures when the environment variable APPROOV_ENABLED is
  // set to true (the default value).
  if (approov.enabled === true && result.isValid === false) {
    // Maybe logging the failure and return a 400 response???
  }

  if (result.isValid === true) {
    // some logging that the check was successful?
  } else if (result.isValid === false) {
    // some logging that the check failed
  } else {
    // if we reach here is because result.isValid is not a boolean.
    // Better to log and open an issue in Github.
  }

  next()
}

// END - APPROOV CALLBACKS

app.get('/unprotected-by-approov', function (req, res) {
    res.json({ text: "This endpoint is not protected by an Approov token!!!"})
})

// All endpoints declared from here will be intercepted to validate the Approov token
app.use('/', approov.middlewareCustomCallbacks.checkToken(approov.config, configErrorCallback, jwtCheckResultCallback))

app.get('/protected-by-approov', function (req, res) {
    res.json({ text: "This endpoint is protected by an Approov token!!!"})
})

app.get('/another-one-protected-by-approov', function (req, res) {
    res.json({ text: "This is another endpoint that is protected by an Approov token!!!"})
})

// your code here ...

// Remember to not give details on the response about why the requests have failed.
//
// Don't make the attackers life easier. Leave them in the dark:
//  * A good status code: 400
//  * A good message is: "Whoops, something went wrong!!!"

```
> similar to this approach used on the Approov Shapes Demo Server.
