# APPROOV INTEGRATION EXAMPLE

An Approov token integration example for a NodeJS Express API as described in the article: [Approov Integration in a NodeJS Express API](https://approov.io/blog//approov-integration-in-a-nodejs-express-api).

## HOW TO USE

For your convenience we host ourselves the backend for this Approov integration walk-through, and the specific url for it can be found on the article, that we invite you to read in order to better understand the purpose and scope for this walk-through.

If you prefer to have control of the backend please follow the [deployment](./docs/DEPLOYMENT.md) guide to deploy the backend to your own online server or just run it in localhost by following the [Approov Shapes API Server](./docs/approov-shapes-api-server.md) walk-through.

The concrete implementation of the Approov Shapes API Server is in the
[approov-protected-server.js](./approov-protected-server.js) file, that
is a simple NodeJS Express server with some endpoints protected by Approov and
other endpoints without any Approov protection.

Now let's continue reading this README for a **quickstart** introduction in how to integrate Approov on a current project by using as an example the code for the Approov Shapes API Server.


## APPROOV VALIDATION PROCESS

Before we dive into the code we need to understand the Approov validation
process on the back-end side.

### The Approov Token

API calls protected by Approov will typically include a header holding an Approov
JWT token. This token must be checked to ensure it has not expired and that it is
properly signed with the secret shared between the back-end and the Approov cloud
service.

We will use a NodeJS package to help us in the validation of the Approov JWT
token.

> **NOTE**
>
> Just to be sure that we are on the same page, a JWT token have 3 parts, that
> are separated by dots and represented as a string in the format of
> `header.payload.signature`. Read more about JWT tokens [here](https://jwt.io/introduction/).

### The Approov Token Binding

When an Approov token contains the key `pay`, its value is a base64 encoded sha256 hash of
some unique identifier in the request, that we may want to bind with the Approov token, in order
to enhance the security on that request, like an Authorization token.

Dummy example for the JWT token middle part, the payload:

```
{
    "exp": 123456789, # required - the timestamp for when the token expires.
    "pay":"f3U2fniBJVE04Tdecj0d6orV9qT9t52TjfHxdUqDBgY=" # optional - a sha256 hash of the token binding value, encoded with base64.
}
```

The token binding in an Approov token is the one in the `pay` key:

```
"pay":"f3U2fniBJVE04Tdecj0d6orV9qT9t52TjfHxdUqDBgY="
```

> **ALERT**: Please bear in mind that the token binding is not meant to pass application data to the API server.

## SYSTEM CLOCK

In order to correctly check for the expiration times of the Approov tokens is
very important that the NodeJS Express server is synchronizing automatically the
system clock over the network with an authoritative time source. In Linux this
is usual done with a NTP server.


## REQUIREMENTS

We will use NodeJS 10 with an Express API server to run our code.

Docker is required for the ones wanting to use the docker environment provided
by the [stack](./stack) bash script, that is a wrapper around docker commands.

Postman is the tool we recommend to be used when simulating the queries against
the API, but feel free to use any other tool of your preference.


## THE DOCKER STACK

We recommend the use of the included Docker stack to play with this Approov
integration.

For details in how to use it you need to follow the setup instructions in the
[Approov Shapes API Server](./docs/approov-shapes-api-server.md#development-environment)
walk-through, but feel free to use your local environment to play with this
Approov integration.


## THE POSTMAN COLLECTION

As you go through your Approov Integration you may want to test it and if you are using Postman then you can import this [Postman collection](https://raw.githubusercontent.com/approov/postman-collections/master/quickstarts/shapes-api/shapes-api.postman_collection.json) to see how it's done for the Approov Shapes API Server [example](./docs/approov-shapes-api-server.md), and use it as an inspiration or starting point for your own collection.

The Approov tokens used in the headers of this Postman collection where manually created with bash commands that used the dummy secret set on the `.env.example` file to sign all the Approov tokens.

If you are using the Aproov secret retrieved with the [Approov CLI]((https://approov.io/docs/latest/approov-cli-tool-reference/)) tool then you need to use it to generate some valid and invalid tokens. Some examples of using it can be found in the Approov [docs](https://approov.io/docs/latest/approov-usage-documentation/#generating-example-tokens).


## INSTALL DEPENDENCIES

If not already using the NPM packages `express-jwt` and `dotenv` in your
project, please add them:

```bash
npm install --save express-jwt dotenv debug
```

## ORIGINAL SERVER

Let's use the [original-server.js](./original-server.js) as an example
for a current server where we want to add Approov to protect some or all the
endpoints.

After we add only the necessary code to integrate Approov, the end result
will look like we have now in the [approov-protected-server.js](./approov-protected-server.js).


## HOW TO INTEGRATE

We will learn how to go from the [original-server.js](./original-server.js) to the
[approov-protected-server.js](./approov-protected-server.js) and how to configure the server.

In order to be able to check the Approov token the `express-jwt` library needs
to know the secret used by the Approov cloud service to sign it. A secure way to
do this is by passing it as an environment variable, as you can see we have done
[here](./configuration.js#L75).

Next we need to define two callbacks to be used during the Approov token check
process. One callback is to perform the check itself with the library
`express-jwt` and the other is to handle any errors occurred during that check.

Let's breakdown the example implementation to make it easier to adapt to your
current project.


### Require Dependencies

We need to require the dependencies we installed before.

[Configuration file](./configuration.js#L1):

```js
// file: configuration.js

// if not already in use add:
require('dotenv').config()
```

[Approov Protected Server file](./approov-protected-server.js#L2-L3):

```js
// file: approov-protected-server.js

const { expressjwt: jwt } = require('express-jwt')
const crypto = require('crypto')
```

### Setup Environment

If you don't have already an `.env` file, then you need to create one in the
root of your project by using this [.env.example](./.env.example) as your
starting point.

The `.env` file must contain the following variables:

```env
# Feel free to play with different secrets. For development only you can create them with:
# $ openssl rand -base64 64 | tr -d '\n'; echo
APPROOV_BASE64_SECRET=h+CX0tOzdAAR9l15bWAqvq7w9olk66daIH+Xk+IAHhVVHszjDzeGobzNnqyRze3lw/WVyWrc2gZfh3XXfBOmww==
APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN=true
APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN_BINDING=true
APPROOV_LOGGING_ENABLED=true
```


Now we can read them from our code, like is done in the [configuration file](./configuration.js#L50-L86):

```js
// file: configuration.js

///////////////////////////
/// APPROOV ENVIRONMENT
//////////////////////////

let isToAbortRequestOnInvalidToken = true
let isToAbortOnInvalidClaim = true
let isApproovLoggingEnabled = true
const abortRequestOnInvalidToken = dotenv.parsed.APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN || 'true'
const abortOnInvalidClaim = dotenv.parsed.APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN_BINDING || 'true'
const approovLoggingEnabled = dotenv.parsed.APPROOV_LOGGING_ENABLED || 'true'

if (abortRequestOnInvalidToken.toLowerCase() === 'false') {
  isToAbortRequestOnInvalidToken = false
}

if (abortOnInvalidClaim.toLowerCase() === 'false') {
  isToAbortOnInvalidClaim = false
}

if (approovLoggingEnabled.toLowerCase() === 'false') {
  isApproovLoggingEnabled = false
}

const approov = {
  abortRequestOnInvalidToken: isToAbortRequestOnInvalidToken,
  abortRequestOnInvalidTokenBinding: isToAbortOnInvalidClaim,
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
```

### Customizable Approov Callbacks

This are callbacks used in the Approov Integration that you may want to
customize to the needs of your application.

Lets's start with the logging callback that we can see in [approov-protected-server.js](./approov-protected-server.js#L72-L75):

```js
// file: approov-protected-server.js

// Callback to be customized with your preferred way of logging.
const logApproov = function(req, res, message) {
  debug(buildLogMessagePrefix(req, res) + ' ' + message)
}
```

Next we have the callback to get the token binding header for the Approov token, as seen in [approov-protected-server.js](./approov-protected-server.js#L77-L83):

```js
// file: approov-protected-server.js

// Callback to be personalized in order to get the token binding header value being used by
// your application.
// In the current scenario we use an Authorization token, but feel free to use what
// suits best your needs.
const getTokenBindingHeader = function(req) {
  return req.get('Authorization')
}
```

Each time an Approov token doesn't validate for any reason the Approov
integration will pass the control to the application logic by invoking a callback as the one defined in [approov-protected-server.js](./approov-protected-server.js#L85-L106):

```js
// file: approov-protected-server.js

// Callback to be customized with how you want to handle a request with an
// invalid Approov token.
// The code included in this callback is provided as an example, that you can
// keep or totally change it in a way that best suits your needs.
const handlesRequestWithInvalidApproovToken = function(err, req, res, next, httpStatusCode) {

  logApproov(req, res, 'APPROOV TOKEN: ' + err)

  // Logging a message to make clear in the logs what was the action we took.
  // Feel free to skip it if you think is not necessary to your use case.
  let message = 'REQUEST WITH INVALID APPROOV TOKEN'

  if (config.approov.abortRequestOnInvalidToken === true) {
    buildBadRequestResponse(req, res, httpStatusCode, 'REJECTED ' + message)
    return
  }

  message = 'ACCEPTED ' + message
  logApproov(req, res, message)
  next()
  return
}
```

Now we have another callback that will be invoked by the Approov integration to
allow the application to decide what action to take when it fails to validate the token
binding in the Approov token, as defined in [approov-protected-server.js](./approov-protected-server.js#L108-L128):

```js
// file: approov-protected-server.js

// Callback to be customized with how you want to handle a request where the
// token binding in the request header doesn't match the the one in the Approov token.
// The code included in this callback is provided as an example, that you can
// keep or totally change it in a way that best suits your needs.
const handlesRequestWithInvalidTokenBinding = function(req, res, next, httpStatusCode, message) {

  logApproov(req, res, message)

  // Logging here to make clear in the logs what was the action we took.
  // Feel free to skip it if you think is not necessary to your use case.
  let logMessage = 'REQUEST WITH INVALID APPROOV TOKEN BINDING'

  if (config.approov.abortRequestOnInvalidTokenBinding === true) {
    buildBadRequestResponse(req, res, httpStatusCode, 'REJECTED ' + logMessage)
    return
  }

  logApproov(req, res, 'ACCEPTED ' + logMessage)
  next()
  return
}
```

The last callback is the one where you can customize the bad request response, as defined in [approov-protected-server.js](./approov-protected-server.js#L130-L135):

```js
// file: approov-protected-server.js

// Callback to build the response when a request fails to pass the Approov checks.
const buildBadRequestResponse = function(req, res, httpStatusCode, logMessage) {
  res.status(httpStatusCode)
  logApproov(req, res, logMessage)
  res.json({})
}
```

### Approov Integration Core Callbacks

This core callbacks are specific to the Approov integration and once they don't
interfere with the flow or behavior of your application we think they are not
in need of being customized.

#### Helper Functions

The core callbacks will need some very basic helper functions, like the ones
defined in the [approov-protected-server](./approov-protected-server.js#L149-L159):

```js
// file: approov-protected-server.js

const isEmpty = function(value) {
  return  (value === undefined) || (value === null) || (value === '')
}

const isString = function(value) {
  return (typeof(value) === 'string')
}

const isEmptyString = function(value) {
  return (isEmpty(value) === true) || (isString(value) === false) ||  (value.trim() === '')
}
```

#### Approov Token

[This callback](./approov-protected-server.js#L165-L181) will be used in
the middleware to check the Approov token:

```js
// file: approov-protected-server.js

// Callback that performs the Approov token check using the express-jwt library
const checkApproovToken = jwt({
  secret: Buffer.from(config.approov.base64Secret, 'base64'), // decodes the Approov secret
  requestProperty: 'approovTokenDecoded',
  getToken: function fromApproovTokenHeader(req, res) {
    req.approovTokenError = false
    const approovToken = req.get('Approov-Token')

    if (isEmptyString(approovToken)) {
      req.approovTokenError = true
      throw new Error('token empty or missing in the header of the request.')
    }

    return approovToken
  },
  algorithms: ['HS256']
})
```

Then we need [this callback](./approov-protected-server.js#L183-L204) to
handle any error that may occur during the Approov token check:

```js
// file: approov-protected-server.js

// Callback to handle the errors occurred while checking the Approov token.
const handlesApproovTokenError = function(err, req, res, next) {

  if (req.approovTokenError === true) {
    // When we reach here, it means the header `Approov-Token` is empty or is missing.
    // @see checkApproovToken()
    handlesRequestWithInvalidApproovToken(err, req, res, next, 400)
    return
  }

  if (err.name === 'UnauthorizedError') {
    // When we reach here, it means that an Error was thrown by the express-jwt
    // library while decoding the Approov token.
    // @see checkApproovToken()
    req.approovTokenError = true
    handlesRequestWithInvalidApproovToken(err, req, res, next, 401)
    return
  }

  next()
  return
}
```

Finally we want to handle when the Approov token succeeds the validation process,
as we have done [approov-protected-server.js](./approov-protected-server.js#L206-L215)

```js
// file: approov-protected-server.js

// Callback to handles when an Approov token is successfully validated.
const handlesApproovTokenSuccess = function(req, res, next) {

    if (req.approovTokenError === false) {
      logApproov(req, res, 'ACCEPTED REQUEST WITH VALID APPROOV TOKEN')
    }

    next()
    return
}
```

#### Approov Token Binding

We will use this two functions to validate if the token binding header in the request
matches the one in the Approov token, as we can see in the [approov-protected-server.js](./approov-protected-server.js#L221-L267):

```js
// file: approov-protected-server.js

// Callback to check the Approov token binding in the header matches with the one in the key `pay` of the Approov token claims.
const handlesApproovTokenBindingVerification = function(req, res, next){

  if (req.approovTokenError === true) {
    next()
    return
  }

  // The decoded Approov token was added to the request object when the checked it at `checkApproovToken()`
  token_binding_payload = req.approovTokenDecoded.pay

  if (token_binding_payload === undefined) {
    handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING ERROR: key 'pay' is missing in the claims of the Approov token payload.")
    return
  }

  if (isEmptyString(token_binding_payload)) {
      handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING ERROR: key 'pay' in the decoded token is empty.")
      return
  }

  // We use here the Authorization token, but feel free to use another header, but you need to bind this  header to
  // the Approov token in the mobile app.
  const token_binding_header = getTokenBindingHeader(req)

  if (isEmptyString(token_binding_header)) {
      handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING ERROR: Missing or empty header to perform the verification for the token binding.")
      return
  }

  // We need to hash and base64 encode the token binding header, because that's how it was included in the Approov
  // token on the mobile app.
  const token_binding_header_encoded = crypto.createHash('sha256').update(token_binding_header, 'utf-8').digest('base64')

  if (token_binding_payload !== token_binding_header_encoded) {
      handlesRequestWithInvalidTokenBinding(req, res, next, 401, "APPROOV TOKEN BINDING ERROR: token binding in header doesn't match with the key 'pay' in the decoded token.")
      return
  }

  logApproov(req, res, 'ACCEPTED REQUEST WITH VALID APPROOV TOKEN BINDING')

  // Let the request continue as usual.
  next()
  return
}
```


### Middleware

We will use the middleware approach to intercept all endpoints we want to protect
with an Approov Token. So any interceptor must be placed before we declare the
endpoints  we want to protect, like is done in the
[approov-protected-server.js](./approov-protected-server.js#L271-L292).

The following examples will use the callbacks we already have defined
[here](#approov-integration-core-callbacks) to pass as the second parameter to
the middleware interceptors.

#### For specific endpoints

To protect specific endpoints in a current server we only need to add the Approov
interceptors for each endpoint we want to protect, as we have done [here](./approov-protected-server.js#L271-L292):

```js
// file: approov-protected-server.js

// Intercepts all calls to the shapes endpoint to validate the Approov token.
app.use('/v2/shapes', checkApproovToken)

// Handles failure in validating the Approov token
app.use('/v2/shapes', handlesApproovTokenError)

// Handles requests where the Approov token is a valid one.
app.use('/v2/shapes', handlesApproovTokenSuccess)

// Intercepts all calls to the forms endpoint to validate the Approov token.
app.use('/v2/forms', checkApproovToken)

// Handles failure in validating the Approov token
app.use('/v2/forms', handlesApproovTokenError)

// Handles requests where the Approov token is a valid one.
app.use('/v2/forms', handlesApproovTokenSuccess)

// Checks if the Approov token binding is valid and aborts the request when the environment variable
// APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN_BINDING is set to true in the environment file.
app.use('/v2/forms', handlesApproovTokenBindingVerification)
```

#### For all endpoints

To protect all endpoints under a certain path, we only need to declare the Approov interceptor for the root of that path, for example if we want to protect all endpoints under `/v2` we need to modify the above code to look like this:

```js
// file: approov-protected-server.js

// Intercepts all calls to the shapes endpoint to validate the Approov token.
app.use('/v2', checkApproovToken)

// Handles failure in validating the Approov token
app.use('/v2', handlesApproovTokenError)

// Handles requests where the Approov token is a valid one.
app.use('/v2', handlesApproovTokenSuccess)

// only use in the root endpoint `/v2` if you want to validate the Approov token binding
// in all endpoints, otherwise declare it per endpoint you want to protect.
app.use('/v2', handlesApproovTokenBindingVerification)
```

To protect every single endpoint in your API, you would replace `/v2/` in above example with only `/`.


### The Code Difference

If we compare the [original-server.js](./original-server.js) with the
[approov-protected-server.js](./approov-protected-server.js) we will see
this file difference:

```js
--- /home/sublime/workspace/node/express/server/original-server.js
+++ /home/sublime/workspace/node/express/server/approov-protected-server.js
@@ -1,4 +1,6 @@
-const debug = require('debug')('original-server')
+const debug = require('debug')('approov-protected-server')
+const jwt = require('express-jwt')
+const crypto = require('crypto')
 const config = require('./configuration')
 const https = require('https')
 const fs = require('fs')
@@ -60,6 +62,243 @@
 }


+////////////////////////////////////////////////////////////////////////////////
+/// YOUR APPLICATION CUSTOMIZABLE CALLBACKS FOR THE APPROOV INTEGRATION
+////////////////////////////////////////////////////////////////////////////////
+///
+/// Feel free to customize this callbacks to best suite the needs your needs.
+///
+
+// Callback to be customized with your preferred way of logging.
+const logApproov = function(req, res, message) {
+  debug(buildLogMessagePrefix(req, res) + ' ' + message)
+}
+
+// Callback to be personalized in order to get the token binding header value being used by
+// your application.
+// In the current scenario we use an Authorization token, but feel free to use what
+// suits best your needs.
+const getTokenBindingHeader = function(req) {
+  return req.get('Authorization')
+}
+
+// Callback to be customized with how you want to handle a request with an
+// invalid Approov token.
+// The code included in this callback is provided as an example, that you can
+// keep or totally change it in a way that best suits your needs.
+const handlesRequestWithInvalidApproovToken = function(err, req, res, next, httpStatusCode) {
+
+  logApproov(req, res, 'APPROOV TOKEN: ' + err)
+
+  // Logging a message to make clear in the logs what was the action we took.
+  // Feel free to skip it if you think is not necessary to your use case.
+  let message = 'REQUEST WITH INVALID APPROOV TOKEN'
+
+  if (config.approov.abortRequestOnInvalidToken === true) {
+    buildBadRequestResponse(req, res, httpStatusCode, 'REJECTED ' + message)
+    return
+  }
+
+  message = 'ACCEPTED ' + message
+  logApproov(req, res, message)
+  next()
+  return
+}
+
+// Callback to be customized with how you want to handle a request where the
+// token binding in the request header doesn't match the the one in the Approov token.
+// The code included in this callback is provided as an example, that you can
+// keep or totally change it in a way that best suits your needs.
+const handlesRequestWithInvalidTokenBinding = function(req, res, next, httpStatusCode, message) {
+
+  logApproov(req, res, message)
+
+  // Logging here to make clear in the logs what was the action we took.
+  // Feel free to skip it if you think is not necessary to your use case.
+  let logMessage = 'REQUEST WITH INVALID APPROOV TOKEN BINDING'
+
+  if (config.approov.abortRequestOnInvalidTokenBinding === true) {
+    buildBadRequestResponse(req, res, httpStatusCode, 'REJECTED ' + logMessage)
+    return
+  }
+
+  logApproov(req, res, 'ACCEPTED ' + logMessage)
+  next()
+  return
+}
+
+// Callback to build the response when a request fails to pass the Approov checks.
+const buildBadRequestResponse = function(req, res, httpStatusCode, logMessage) {
+  res.status(httpStatusCode)
+  logApproov(req, res, logMessage)
+  res.json({})
+}
+
+
+////////////////////////////////////////////////////////////////////////////////
+/// STARTS NON CUSTOMIZABLE LOGIC FOR THE APPROOV INTEGRATION
+////////////////////////////////////////////////////////////////////////////////
+///
+/// This section contains code that is specific to the Approov integration,
+/// thus we think that is not necessary to customize it, once is not
+/// interfering with your application logic or behavior.
+///
+
+////// APPROOV HELPER FUNCTIONS //////
+
+const isEmpty = function(value) {
+  return  (value === undefined) || (value === null) || (value === '')
+}
+
+const isString = function(value) {
+  return (typeof(value) === 'string')
+}
+
+const isEmptyString = function(value) {
+  return (isEmpty(value) === true) || (isString(value) === false) ||  (value.trim() === '')
+}
+
+
+////// APPROOV TOKEN //////
+
+
+// Callback that performs the Approov token check using the express-jwt library
+const checkApproovToken = jwt({
+  secret: Buffer.from(config.approov.base64Secret, 'base64'), // decodes the Approov secret
+  requestProperty: 'approovTokenDecoded',
+  getToken: function fromApproovTokenHeader(req, res) {
+    req.approovTokenError = false
+    const approovToken = req.get('Approov-Token')
+
+    if (isEmptyString(approovToken)) {
+      req.approovTokenError = true
+      throw new Error('token empty or missing in the header of the request.')
+    }
+
+    return approovToken
+  },
+  algorithms: ['HS256']
+})
+
+// Callback to handle the errors occurred while checking the Approov token.
+const handlesApproovTokenError = function(err, req, res, next) {
+
+  if (req.approovTokenError === true) {
+    // When we reach here, it means the header `Approov-Token` is empty or is missing.
+    // @see checkApproovToken()
+    handlesRequestWithInvalidApproovToken(err, req, res, next, 400)
+    return
+  }
+
+  if (err.name === 'UnauthorizedError') {
+    // When we reach here, it means that an Error was thrown by the express-jwt
+    // library while decoding the Approov token.
+    // @see checkApproovToken()
+    req.approovTokenError = true
+    handlesRequestWithInvalidApproovToken(err, req, res, next, 401)
+    return
+  }
+
+  next()
+  return
+}
+
+// Callback to handles when an Approov token is successfully validated.
+const handlesApproovTokenSuccess = function(req, res, next) {
+
+    if (req.approovTokenError === false) {
+      logApproov(req, res, 'ACCEPTED REQUEST WITH VALID APPROOV TOKEN')
+    }
+
+    next()
+    return
+}
+
+
+////// APPROOV TOKEN BINDING //////
+
+
+// Callback to check the Approov token binding in the header matches with the one in the key `pay` of the Approov token claims.
+const handlesApproovTokenBindingVerification = function(req, res, next){
+
+  if (req.approovTokenError === true) {
+    next()
+    return
+  }
+
+  // The decoded Approov token was added to the request object when the checked it at `checkApproovToken()`
+  token_binding_payload = req.approovTokenDecoded.pay
+
+  if (token_binding_payload === undefined) {
+    handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING ERROR: key 'pay' is missing in the claims of the Approov token payload.")
+    return
+  }
+
+  if (isEmptyString(token_binding_payload)) {
+      handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING ERROR: key 'pay' in the decoded token is empty.")
+      return
+  }
+
+  // We use here the Authorization token, but feel free to use another header, but you need to bind this  header to
+  // the Approov token in the mobile app.
+  const token_binding_header = getTokenBindingHeader(req)
+
+  if (isEmptyString(token_binding_header)) {
+      handlesRequestWithInvalidTokenBinding(req, res, next, 400, "APPROOV TOKEN BINDING ERROR: Missing or empty header to perform the verification for the token binding.")
+      return
+  }
+
+  // We need to hash and base64 encode the token binding header, because that's how it was included in the Approov
+  // token on the mobile app.
+  const token_binding_header_encoded = crypto.createHash('sha256').update(token_binding_header, 'utf-8').digest('base64')
+
+  if (token_binding_payload !== token_binding_header_encoded) {
+      handlesRequestWithInvalidTokenBinding(req, res, next, 401, "APPROOV TOKEN BINDING ERROR: token binding in header doesn't match with the key 'pay' in the decoded token.")
+      return
+  }
+
+  logApproov(req, res, 'ACCEPTED REQUEST WITH VALID APPROOV TOKEN BINDING')
+
+  // Let the request continue as usual.
+  next()
+  return
+}
+
+/////// THE APPROOV INTERCEPTORS ///////
+
+// Intercepts all calls to the shapes endpoint to validate the Approov token.
+app.use('/v2/shapes', checkApproovToken)
+
+// Handles failure in validating the Approov token
+app.use('/v2/shapes', handlesApproovTokenError)
+
+// Handles requests where the Approov token is a valid one.
+app.use('/v2/shapes', handlesApproovTokenSuccess)
+
+// Intercepts all calls to the forms endpoint to validate the Approov token.
+app.use('/v2/forms', checkApproovToken)
+
+// Handles failure in validating the Approov token
+app.use('/v2/forms', handlesApproovTokenError)
+
+// Handles requests where the Approov token is a valid one.
+app.use('/v2/forms', handlesApproovTokenSuccess)
+
+// Checks if the Approov token binding is valid and aborts the request when the environment variable
+// APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN_BINDING is set to true in the environment file.
+app.use('/v2/forms', handlesApproovTokenBindingVerification)
+
+/// NOTE:
+///   Is important to place all the Approov interceptors before we declare the
+///   endpoints of the API, otherwise they will not be able to intercept any
+///   request.
+
+////////////////////////////////////////////////////////////////////////////////
+/// ENDS APPOOV INTEGRATION
+////////////////////////////////////////////////////////////////////////////////
+
 ////////////////
 // ENDPOINTS
 ////////////////
@@ -84,6 +323,28 @@
 app.get('/v1/forms', function(req, res, next) {
   logResponseToRequest(req, res)
   buildFormsResponse(res, 'unprotected')
+})
+
+/**
+ * V2 ENDPOINTS
+ */
+
+// simple 'hello world' endpoint.
+app.get('/v2/hello', function (req, res, next) {
+  logResponseToRequest(req, res)
+  buildHelloWorldResponse(res)
+})
+
+// shapes endpoint returns a random shape.
+app.get('/v2/shapes', function(req, res, next) {
+  logResponseToRequest(req, res)
+  buildShapesResponse(res, 'protected')
+})
+
+// shapes endpoint returns a random form.
+app.get('/v2/forms', function(req, res, next) {
+  logResponseToRequest(req, res)
+  buildFormsResponse(res, 'protected')
 })
```

As we can see the Approov integration in a current server is simple, easy and is
done with just a few lines of code.

If you have not done it already, now is time to follow the
[Approov Shapes API Server](./docs/approov-shapes-api-server.md) walk-through
to see and have a feel for how all this works.


## PRODUCTION

In order to protect the communication between your mobile app and the API server
is important to only communicate hover a secure communication channel, aka HTTPS, and to use certificate pinning.

We do not use HTTPS and certificate pinning in this Approov integration example
because we want to be able to run the [Approov Shapes API Server](./docs/approov-shapes-api-server.md) in localhost.

Please bear in mind that HTTPS on its own is not enough, certificate pinning
must be also used to pin the connection between the mobile app and the API
server in order to prevent Man in the Middle Attacks and Approov provides out of the box [Dynamic Certificate Pinning](https://approov.io/product/dynamic-cert-pinning) to allow your mobile app to pin the connection to your API server without for you to have to write a single line of code, while giving you the ability to update the pins remotely with the [Approov CLI Tool](https://approov.io/docs/latest/approov-cli-tool-reference/#api-command). Yes you will not need to release a new mobile app to revoke/rotate certificates.
