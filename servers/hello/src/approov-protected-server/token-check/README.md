# Approov Token Integration Example

This Approov integration example is from where the code example for the [Approov token check quickstart](/docs/APPROOV_TOKEN_QUICKSTART.md) is extracted, and you can use it as a playground to better understand how simple and easy it is to implement [Approov](https://approov.io) in a NodeJS Express API server.

## TOC - Table of Contents

* [Why?](#why)
* [How it Works?](#how-it-works)
* [Requirements](#requirements)
* [Setup Env File](#setup-env-file)
* [Try the Approov Integration Example](#try-the-approov-integration-example)


## Why?

To lock down your API server to your mobile app. Please read the brief summary in the [README](/README.md#why) at the root of this repo or visit our [website](https://approov.io/product.html) for more details.

[TOC](#toc---table-of-contents)


## How it works?

The NodeJS Express API server is very simple and is defined in the file [src/approov-protected-server/token-check/hello_server_protected.js](/servers/hello/src/approov-protected-server/token-check/hello_server_protected.js). Take a look at the `verifyApproovToken()` function to see the simple code for the check.

For more background on Approov, see the overview in the [README](/README.md#how-it-works) at the root of this repo.

[TOC](#toc---table-of-contents)


## Requirements

To run this example you will need to have installed:

* [NodeJS](https://nodejs.org/en/download/)

[TOC](#toc---table-of-contents)


## Setup Env File

From `/servers/hello/src/approov-protected-server/token-check` execute the following:

```bash
cp .env.example .env
```

Edit each file and add the [dummy secret](/README.md#the-dummy-secret) to it in order to be able to test the Approov integration with the provided [Postman collection](https://github.com/approov/postman-collections/blob/master/quickstarts/hello-world/hello-world.postman_curl_requests_examples.md).

[TOC](#toc---table-of-contents)


## Try the Approov Integration Example

First, you need to install the dependencies. From the `/servers/hello/src/approov-protected-server/token-check` folder execute:

```bash
npm install
```

Now, you can run this example from the `/servers/hello/src/approov-protected-server/token-check` folder with:

```text
npm start
```

Next, you can test that it works with:

```text
curl -iX GET 'http://localhost:8002'
```

The response will be a `401` unauthorized request:

```text
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 2
ETag: W/"2-vyGp6PvFo4RvsFtPoIWeCReyIC8"
Date: Wed, 16 Mar 2022 19:59:24 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{}
```

The reason you got a `401` is because no Approoov token isn't provided in the headers of the request.

Finally, you can test that the Approov integration example works as expected with this [Postman collection](/README.md#testing-with-postman) or with some cURL requests [examples](/README.md#testing-with-curl).

[TOC](#toc---table-of-contents)