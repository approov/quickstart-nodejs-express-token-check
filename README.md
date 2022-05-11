# Approov QuickStart - NodeJS Express Token Check

[Approov](https://approov.io) is an API security solution used to verify that requests received by your backend services originate from trusted versions of your mobile apps.

This repo implements the Approov server-side request verification code with the NodeJS Express framework in a simple Hello API server, which performs the verification check before allowing valid traffic to be processed by the API endpoint.

Originally this repo was just to show the Approov token integration example on a NodeJS Express API as described in the article: [Approov Integration in a NodeJS Express API](https://blog.approov.io/approov-integration-in-a-nodejs-express-api), that you can still find at [/servers/shapes-api](/servers/shapes-api).


## Approov Integration Quickstart

The quickstart was tested with the following Operating Systems:

* Ubuntu 20.04
* MacOS Big Sur
* Windows 10 WSL2 - Ubuntu 20.04

First, setup the [Appoov CLI](https://approov.io/docs/latest/approov-installation/index.html#initializing-the-approov-cli).

Now, register the API domain for which Approov will issues tokens:

```bash
approov api -add api.example.com
```

Next, enable your Approov `admin` role with:

```bash
eval `approov role admin`
```

Now, get your Approov Secret with the [Appoov CLI](https://approov.io/docs/latest/approov-installation/index.html#initializing-the-approov-cli):

```bash
approov secret -get base64
```

Next, add the [Approov secret](https://approov.io/docs/latest/approov-usage-documentation/#account-secret-key-export) to your project `.env` file:

```env
APPROOV_BASE64_SECRET=approov_base64_secret_here
```

Now, add to your `package.json` file the [JWT dependency](https://github.com/auth0/express-jwt):

```json
"express-jwt": "^6.0.0"
```

Next, in your code require the JWT package:

```javascript
const jwt = require('express-jwt')
```

Now, grab the Approov secret and set it into a constant:

```javascript
const dotenv = require('dotenv').config()
const approovBase64Secret = dotenv.parsed.APPROOV_BASE64_SECRET;
const approovSecret = Buffer.from(approovBase64Secret, 'base64')
```

Next, verify the Approov token:

```javascript
// Callback that performs the Approov token check using the express-jwt library
const verifyApproovToken = jwt({
  secret: APPROOV_SECRET,
  requestProperty: 'approovTokenDecoded',
  getToken: function fromApproovTokenHeader(req, res) {
    return req.get('Approov-Token')
  },
  algorithms: ['HS256']
})
```

Now, handle errors when verifying Approov tokens:

```js
// Callback to handle the errors occurred while checking the Approov token.
const approovTokenErrorHandler = (err, req, res, next) => {
  // When has an error, it means the header `Approov-Token` is empty, missing or
  // have failed validation of signature, expire time or is malformed.
  if (err.name === 'UnauthorizedError') {
    res.status(401)
    res.json({})
    return
  }

  next()
}
```

Next, set the callbacks as a request middleware:

```js
const api = express()

// Middleware to handle the validation of the Approov token for all your API
// endpoints.
api.use(verifyApproovToken)
api.use(approovTokenErrorHandler)
````

Not enough details in the bare bones quickstart? No worries, check the [detailed quickstarts](QUICKSTARTS.md) that contain a more comprehensive set of instructions, including how to test the Approov integration.


## More Information

* [Approov Overview](OVERVIEW.md)
* [Detailed Quickstarts](QUICKSTARTS.md)
* [Examples](EXAMPLES.md)
* [Testing](TESTING.md)


## Issues

If you find any issue while following our instructions then just report it [here](https://github.com/approov/quickstart-nodejs-express-token-check/issues), with the steps to reproduce it, and we will sort it out and/or guide you to the correct path.


## Useful Links

If you wish to explore the Approov solution in more depth, then why not try one of the following links as a jumping off point:

* [Approov Free Trial](https://approov.io/signup)(no credit card needed)
* [Approov Get Started](https://approov.io/product/demo)
* [Approov QuickStarts](https://approov.io/docs/latest/approov-integration-examples/)
* [Approov Docs](https://approov.io/docs)
* [Approov Blog](https://approov.io/blog/)
* [Approov Resources](https://approov.io/resource/)
* [Approov Customer Stories](https://approov.io/customer)
* [Approov Support](https://approov.zendesk.com/hc/en-gb/requests/new)
* [About Us](https://approov.io/company)
* [Contact Us](https://approov.io/contact)
