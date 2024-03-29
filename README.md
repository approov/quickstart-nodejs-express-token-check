# Approov QuickStart - NodeJS Express Token Check

[Approov](https://approov.io) is an API security solution used to verify that requests received by your backend services originate from trusted versions of your mobile apps.

This repo implements the Approov server-side request verification code with the NodeJS Express framework in a simple Hello API server, which performs the verification check before allowing valid traffic to be processed by the API endpoint.

Originally this repo was just to show the Approov token integration example on a NodeJS Express API as described in the article: [Approov Integration in a NodeJS Express API](https://approov.io/blog//approov-integration-in-a-nodejs-express-api), that you can still find at [/servers/shapes-api](/servers/shapes-api).


## Approov Integration Quickstart

The quickstart was tested with the following Operating Systems:

* Ubuntu 20.04
* MacOS Big Sur
* Windows 10 WSL2 - Ubuntu 20.04

First, setup the [Approov CLI](https://approov.io/docs/latest/approov-installation/index.html#initializing-the-approov-cli).

Now, register the API domain for which Approov will issues tokens:

```bash
approov api -add api.example.com
```

> **NOTE:** By default a symmetric key (HS256) is used to sign the Approov token on a valid attestation of the mobile app for each API domain it's added with the Approov CLI, so that all APIs will share the same secret and the backend needs to take care to keep this secret secure.
>
> A more secure alternative is to use asymmetric keys (RS256 or others) that allows for a different keyset to be used on each API domain and for the Approov token to be verified with a public key that can only verify, but not sign, Approov tokens.
>
> To implement the asymmetric key you need to change from using the symmetric HS256 algorithm to an asymmetric algorithm, for example RS256, that requires you to first [add a new key](https://approov.io/docs/latest/approov-usage-documentation/#adding-a-new-key), and then specify it when [adding each API domain](https://approov.io/docs/latest/approov-usage-documentation/#keyset-key-api-addition). Please visit [Managing Key Sets](https://approov.io/docs/latest/approov-usage-documentation/#managing-key-sets) on the Approov documentation for more details.

Next, enable your Approov `admin` role with:

```bash
eval `approov role admin`
````

For the Windows powershell:

```bash
set APPROOV_ROLE=admin:___YOUR_APPROOV_ACCOUNT_NAME_HERE___
```

Now, get your Approov Secret with the [Approov CLI](https://approov.io/docs/latest/approov-installation/index.html#initializing-the-approov-cli):

```bash
approov secret -get base64
```

Next, add the [Approov secret](https://approov.io/docs/latest/approov-usage-documentation/#account-secret-key-export) to your project `.env` file:

```env
APPROOV_BASE64_SECRET=approov_base64_secret_here
```

Now, add to your `package.json` file the [JWT dependency](https://github.com/auth0/express-jwt):

```json
"express-jwt": "^8.3.0"
```

Next, in your code require the JWT package:

```javascript
const { expressjwt: jwt } = require('express-jwt')
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

### System Clock

In order to correctly check for the expiration times of the Approov tokens is very important that the backend server is synchronizing automatically the system clock over the network with an authoritative time source. In Linux this is usually done with a NTP server.


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
* [Approov Support](https://approov.io/contact)
* [About Us](https://approov.io/company)
* [Contact Us](https://approov.io/contact)
