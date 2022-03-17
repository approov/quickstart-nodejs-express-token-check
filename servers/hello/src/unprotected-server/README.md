# Unprotected Server Example

The unprotected example is the base reference to build the [Approov protected servers](/servers/hello/src/approov-protected-server/). This a very basic Hello World server.


## TOC - Table of Contents

* [Why?](#why)
* [How it Works?](#how-it-works)
* [Requirements](#requirements)
* [Try It](#try-it)


## Why?

To be the starting building block for the [Approov protected servers](/servers/hello/src/approov-protected-server/), that will show you how to lock down your API server to your mobile app. Please read the brief summary in the [README](/README.md#why) at the root of this repo or visit our [website](https://approov.io/product.html) for more details.

[TOC](#toc---table-of-contents)


## How it works?

The NodeJS Express API server is very simple and is defined in the file [src/unprotected-server/hello-server-unprotected.js](/servers/hello/src/unprotected-server/hello-server-unprotected.js).

The server only replies to the endpoint `/` with the message:

```json
{"message": "Hello, World!"}
```

[TOC](#toc---table-of-contents)


## Requirements

To run this example you will need to have installed:

* [NodeJS](https://nodejs.org/en/download/)

[TOC](#toc---table-of-contents)


## Try It

First install the dependencies.

From the `./servers/hello/src/unprotected-server` folder execute:

```bash
npm install
```

Now, you can run this example from the `./servers/hello/src/unprotected-server` folder with:

```bash
npm start
```

Finally, you can test that it works with:

```bash
curl -X GET 'http://localhost:8002'
```

The response will be:

```json
{"message":"Hello, World!"}
```

[TOC](#toc---table-of-contents)
