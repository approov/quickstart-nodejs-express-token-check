# APPROOV SHAPES DEMO SERVER

The Approov Shapes Demo Server contains endpoints with and without the Approov
protection. The protected endpoints differ in the sense that one uses the
optional custom payload claim in the Approov token.

We will demonstrate how to call each API endpoint with screen-shots from Postman
and from the shell. Postman is used here as an easy way to demonstrate
how you can play with the Approov integration in the API server, but to see a
real demo of how Approov would work in production you need to request a demo
[here](https://info.approov.io/demo).

When presenting the screen-shots we will show them as 2 distinct views. The
Postman view will tell how we performed the request and what response we got
back and the shell view show us the log entries that lets us see the result of
checking the Approov token and how the requested was handled.


## REQUIREMENTS

* NodeJS.
* Postman - to simulate calls to the the API server.

## INSTALL

### Approov Shapes Demo Server

The demo is not in NPM, thus we need to clone it...

```bash
git clone https://github.com/approov/nodejs-express_shapes-demo-server.git approov-demo && cd appoov-demo
```

### Development Environment

In order to have an agnostic development environment through this tutorial we
recommend the use of Docker, that can be installed by following [the official
instructions](https://docs.docker.com/install/) for your platform.

A bash script `./stack` is provided in the root of the demo to make easy to use
the docker stack to run this demo.

Show the usage help with:

```bash
$ ./stack

./stack

DOCKER STACK CLI WRAPPER

This bash script is a wrapper around docker for easier use of the docker stack
in this project.

Signature:
  ./stack [options] <command> <args>


Usage:
  ./stack
  ./stack [-h | --help] [-p | --port] [-u | --user] <command> <args>


Options:
  -h | --help  Shows this help.
  -p | --port  The host port to access the docker container.
  -u | --user  Run the docker container under the given user name or uid.


Commands/Args:
  build                     Builds the docker image for this stack:
                              ./stack build

  approov-protected-server  Runs the approov server:
                              ./stack approov-protected-server
                              ./stack --port 5000 approov-protected-server

  original-server           Runs the original server:
                              ./stack original-server
                              ./stack --port 5001 original-server

  stop <server>             Stops the docker container for the given server:
                              ./stack stop approov-protected-server

  shell <name> <server>     Starts a shell in a new container:
                              ./stack shell
                              ./stack shell zsh
                              ./stack --port 5001 shell zsh original-server
```

#### Building the docker image:

```bash
./stack build
```
> The image will contain the Shapes Demo Server in NodeJS.

#### Getting a bash shell inside the docker container:

```bash
./stack shell
```
> If you choose to continue following this demo using Docker, then all subsequent
  commands must be executed from this shell.

## SETUP

### Environment File

Lets' copy the `.env.example` to `.env` with the command:

```bash
cp .env-example .env
```

No modifications are necessary to the newly created `.env` in order to run the
demo with the provided Postman collection.


### Installing dependencies

```bash
npm install
```

## RUNNING THE APPROOV SHAPES DEMO SERVER

We will run this demo first with Approov enabled and a second time with Approov
disabled. When Approov is enabled any API endpoint protected by an Approov token
will have the request denied with a `400` response for each time the Approov
token check fails for any reason. When Approov is disabled the check still
takes place but no requests are denied, only the reason for the failure is
logged, if logging is enabled.

### The logs

When a request is issued from Postman you can see the logs being printed to your
shell and you can search for `approov-protected-server` to see all log entries
about requests protected by Approov and compare the logged messages with the
results returned to Postman for failures or success in the validation of
requests protected by Approov.

An example for an accepted request:

```bash
approov-protected-server 200 GET /v2/forms ACCEPTED REQUEST WITH VALID APPROOV TOKEN +14s
approov-protected-server 200 GET /v2/forms ACCEPTED REQUEST WITH VALID CLAIM VALUE +0ms
```

Examples for rejected requests:

```bash
# example 1
approov-protected-server 200 GET /v2/forms ACCEPTED REQUEST WITH VALID APPROOV TOKEN +9s
approov-protected-server 200 GET /v2/forms REQUEST WITH CLAIM VALUE NOT MATCHING THE CUSTOM PAYLOAD CLAIM IN THE APPROOV TOKEN +0ms
approov-protected-server 400 GET /v2/forms REJECTED REQUEST WITH INVALID CLAIM VALUE +0ms

# example 2
approov-protected-server 200 GET /v2/forms APPROOV TOKEN ERROR: UnauthorizedError: jwt malformed +2m
approov-protected-server 400 GET /v2/forms REJECTED REQUEST WITH INVALID APPROOV TOKEN +0ms

# example 3
approov-protected-server 200 GET /v2/forms APPROOV TOKEN ERROR: UnauthorizedError: No authorization token was found +6s
approov-protected-server 400 GET /v2/forms REJECTED REQUEST WITH INVALID APPROOV TOKEN +1ms
```

### Starting Postman

Open Postman and import [this collection](https://gitlab.com/snippets/1799104/raw)
that contains all the API endpoints prepared with all scenarios we want to
demonstrate.

### Approov Tokens Generation

The Approov tokens used in the Postman collection where generated by the [Approov CLI Tool](https://approov.io/docs/v2.0/approov-cli-tool-reference/), that can be downloaded from [here](https://approov.io/downloads/approovcli.zip), and the [management tokens](https://approov.io/docs/v2.0/approov-usage-documentation/#management-tokens) to operate the tool need to be obtained by requesting a [Shapes Hands on Demo](https://info.approov.io/demo).

Follow the [Approov installation](https://approov.io/docs/v2.0/approov-installation/) steps to get the Approov CLI tool working on your computer, and after you will be able to generate your own Approov tokens.

First of all lets set the environment variable to the Approov CLI tool management token:

```bash
export APPROOV_MANAGEMENT_TOKEN=$(cat ~/path/to/approov/management/token/development.tok)
```

To show the usage help for creating Approov Tokens:

```bash
$ approov token
  -check value
      check the validity of an Approov token or loggable token
  -genExample value
      generates an example Approov token for the given API domain with a 1 hour expiry time
  -genLongLived value
      generates a long lived Approov token with <issuer>,<duration (e.g 1y, 30d)>
  -setDataHashInToken value
      sets data to be hashed for an example Approov token
  -type value
      sets the type of an example Approov token of valid, invalid or failover
New approov CLI tools are available from https://approov.io/downloads/approovcli.zip
```

With default 1 hour expire time and without a custom payload claim:

```bash
$ approov token -genExample shapes.approov.io
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NjM4OTQ4NDEsImlwIjoiMS4yLjMuNCIsImRpZCI6IkV4YW1wbGVBcHByb292VG9rZW5ESUQ9PSJ9.qfTKxvZOd0QRhq1JQfIerlHzSIFj3R1VfNtwcKTOp4U
```

With a custom payload claim, like using the `Authorization` header value:

```bash
$ approov token -genExample shapes.approov.io -setDataHashInToken Like-The-Authorization-Header-Value
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE1NjM4OTYzOTMsImlwIjoiMS4yLjMuNCIsImRpZCI6IkV4YW1wbGVBcHByb292VG9rZW5ESUQ9PSIsInBheSI6IllVK01YZEM4V3NpaTd6NmdCVnhPamhVU21rTGE2RytpK3FMNjBIYi8zdUU9In0.FuwDA12780bUvWKMr1P357CBCWVf-KukLQyu1O5E2yA
```

Feel free to try all the options...


### Starting the NodeJS Express server

Before we start the server we will want to setup the debug level to be used accross all restarts:

```
export DEBUG=approov-protected-server
```

Confirming that is properly set:

```
$ echo $DEBUG
approov-protected-server
```

To start the server we want to issue the command:

```bash
npm start
```

### Endpoint Not Protected by Approov

This endpoint does not benefit from Approov protection and the goal here is to
show that both Approov protected and unprotected endpoints can coexist in the
same API server.

#### /v2/hello

**Postman View:**

![postman hello endpoint](./assets/img/postman-hello.png)
> As we can see we have not set any headers.

**Shell view:**

![shell hello endpoint](./assets/img/shell-hello.png)
> As expected the logs don't have entries with Approov errors.


**Request Overview:**

Looking into the Postman view, we can see that the request was sent without the
`approov-token` header and we got a `200` response that matches the one in the
logs output from the shell view.


### Endpoints Protected by an Approov Token

This endpoint requires a `approov-token` header and depending on the boolean
value for the environment variable `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN` we will
have 2 distinct behaviours. When being set to `true` we refuse to fulfil the
request and when set to `false` we will let the request pass through. For both
behaviours we log the result of checking the Approov token id the environment
variable `APPROOV_LOGGING_ENABLED` is set to `true`.

The default behaviour is to have `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN` set to
`true`, but you may feel more comfortable to have it setted to `false` during
the initial deployment, until you are confident that you are only refusing bad
requests to your API server.

#### /v2/shapes - missing the Approov token header

Make sure that the `.env` file contains `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN` set to `true`.

Cancel current server session with `ctrl+c` and start it again with:

```bash
npm start
```

**Postman view:**

![Postman - shapes endpoint without an Approov token](./assets/img/postman-shapes-missing-approov-token.png)
> As we can see we have not set any headers.

**Shell view:**

![Shell - shapes endpoint without an Approov token](./assets/img/shell-shapes-missing-approov-token.png)
> As expected status code in the logs matches the one in the Postman response.

**Request Overview:**

Looking to the Postman view we can see that we forgot to add the `approov-token`
header, thus a `400` response is returned.

In the shell view we can see in the logs entries that Approov is enabled and the Approov token is empty and this is the reason why the `400` response was
returned to Postman.

**Let's see the same request with Approov disabled**

Make sure that the `.env` file contains `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN` set to `false`.

Cancel current server session with `ctrl+c` and start it again with:

```bash
npm start
```

**Postman view:**

![Postman - shapes endpoint without an Approov token and approov disabled](./assets/img/postman-shapes-missing-approov-token-and-approov-disabled.png)
> Did you notice that now we have a successfully response back?

**Shell view:**

![Shell - shapes endpoint without an Approov token and approov disabled](./assets/img/shell-shapes-missing-approov-token-and-approov-disabled.png)
> Can you see where are the new log entries?

**Request Overview:**

We continue to not provide the `approov-token` header but this time we have a
`200` response with the value for the shape, but once Approov is disabled the
request is not denied.

Looking into the shell view we can see that the logs continue to tell us that
the JWT token is empty, but now we can see a log entry for the `/v2/shapes`
endpoint response with the status code `200`, meaning that the request was
fulfilled and a successful response sent back.


#### /v2/shapes - Invalid Approov token header

Make sure that the `.env` file contains `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN` set to `true`.

Cancel current server session with `ctrl+c` and start it again with:

```bash
npm start
```

**Postman view:**

![Postman - shapes endpoint with an invalid Approov token](./assets/img/postman-shapes-invalid-token.png)
> Did you notice the `approov-token` with an invalid JWT token?

**Shell view:**

![Shell - shapes endpoint with an invalid Approov token](./assets/img/shell-shapes-invalid-token.png)
> Can you spot what is the reason for the `400` response?

**Request Overview:**

In Postman we issue the request with an invalid `approov-token` header, that is
a normal string, not a JWT token, thus we get back a `400` response with the
debug code.

Looking to shell view we can see that the logs is also telling us that the
request was denied with a `400` and that the reason is an invalid JWT token,
that doesn't contain enough segments.


**Let's see the same request with Approov disabled**

Make sure that the `.env` file contains `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN` set to `false`.

Cancel current server session with `ctrl+c` and start it again with:

```bash
npm start
```

**Postman view:**

![Postman - shapes endpoint with an invalid Approov token and approov disabled](./assets/img/postman-shapes-invalid-token-and-approov-disabled.png)


**Shell view:**

![Shell - shapes endpoint with an invalid Approov token and approov disabled](./assets/img/shell-shapes-invalid-token-and-approov-disabled.png)


**Request Overview:**

In Postman, instead of sending a valid JWT token, we continue to send the
`approov-token` header as a normal string, but this time we got a `200` response
back because Approov is disabled, thus not blocking the request.

In the shell view we continue to see the same reason for the Approov token
validation failure and we can confirm the `200` response as Postman shows.


#### /v2/shapes - Valid Approov token header

Make sure that the `.env` file contains `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN` set to `true`.

Cancel current server session with `ctrl+c` and start it again with:

```bash
npm start
```

> **NOTE**:
>
> For your convenience the Postman collection includes a token that only expires
> in a very distant future for this call "Approov Token with valid signature and
> expire time". For the call "Expired Approov Token with valid signature" an
> expired token is also included.


**Postman view with token correctly signed and not expired token:**

![Postman - shapes endpoint with a valid Approov token](./assets/img/postman-shapes-valid-token.png)

**Postman view with token correctly signed but this time is expired:**

![Postman - shapes endpoint with a expired Approov token](./assets/img/postman-shapes-expired-token.png)


**Shell view:**

![Shell - shapes endpoint with a valid and with a expired Approov token](./assets/img/shell-shapes-valid-and-expired-token.png)


**Request Overview:**

We used an helper script to generate an Approov Token that was valid for 1
minute.

In Postman we performed 2 requests with the same token and the first one was
successful, but the second request, performed 2 minutes later, failed with a
`400` response because the token have already expired as we can see by the
log messages in the shell view.


**Let's see the same request with Approov disabled**

Make sure that the `.env` file contains `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN` set to `false`.

Cancel current server session with `ctrl+c` and start it again with:

```bash
npm start
```
**Postman view with token valid for 1 minute:**

![Postman - shapes endpoint with a valid Approov token and Approov disabled](./assets/img/postman-shapes-valid-token-and-approov-disabled.png)

**Postman view with same token but this time is expired:**

![Postman - shapes endpoint with a expired Approov token and Approov disabled](./assets/img/postman-shapes-expired-token-and-approov-disabled.png)

**Shell view:**

![Shell - shapes endpoint with a valid, with an expired Approov token and Approov disabled](./assets/img/shell-shapes-approov-disabled-with-valid-and-expired-token.png)
> Can you spot where is the difference between this shell view and the previous
> one?

**Request Overview:**

We repeated the process to generate the Appoov token with 1 minute of expiration
time.

Once more we performed the 2 requests with the same token and with 2 minutes
interval between them but this time we got both of them with `200` responses.

If we look into the shell view we can see that the first request have
a valid token and in the second request the token is not valid because is
expired, but once Approov is disabled the request is accepted.

### Endpoints Protected by an Approov Token with Custom Payload Claim

A custom payload claim is optional in any Approov token and you can read
more about them [here](./../README.md#approov-validation-process).

The requests where the custom payload claim is checked will be rejected on
failure but only if the environment variable
`APPROOV_ABORT_REQUEST_ON_INVALID_CUSTOM_PAYLOAD_CLAIM` is set to `true`. To
bear in mind that before this check is done the request have already been
through the same flow we have described for the `/v2/shapes` endpoint.


#### /v2/forms - Invalid Custom Payload Claim in the Approov token

Make sure that the `.env` file contains `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN`
and `APPROOV_ABORT_REQUEST_ON_INVALID_CUSTOM_PAYLOAD_CLAIM` set to `true`.

Cancel current server session with `ctrl+c` and start it again with:

```bash
npm start
```

**Postman view:**

![Postman - forms endpoint with invalid custom payload claim](./assets/img/postman-forms-invalid-custom-payload-claim.png)

**Shell view:**

![Shell - forms endpoint with invalid custom payload claim](./assets/img/shell-forms-invalid-custom-payload-claim.png)

**Request Overview:**

In Postman we added an Approov token with a custom payload claim not matching
the Authorization token, thus the API server rejects the request with a `400` response.

While we can see in the shell view that the request is accepted for the Approov
token itself it rejects the request afterwards due to an invalid custom payload
contained in the Approov token, thus returning a `400` response.

> **IMPORTANT**:
>
> When decoding the Approov token we only check if the signature and expiration
> time are valid, nothing else within the token is checked.
>
> The custom payload claim check works on the decoded Approov token to validate
> if the claim included in the payload key `pay` is the expected one.


**Let's see the same request with Approov disabled**

Make sure that the `.env` file contains `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN`
and `APPROOV_ABORT_REQUEST_ON_INVALID_CUSTOM_PAYLOAD_CLAIM` set to `false`.

Cancel current server session with `ctrl+c` and start it again with:

```bash
npm start
```

**Postman view:**

![Postman - forms endpoint with invalid custom payload claim](./assets/img/postman-forms-invalid-custom-payload-claim-with-approov-disabled.png)

**Shell view:**

![Shell - forms endpoint with invalid custom payload claim](./assets/img/shell-forms-invalid-custom-payload-claim-with-approov-disabled.png)

**Request Overview:**

We still have the invalid custom payload claim in the Approov token but once we
have disabled Approov we now have a `200` response.

In the shell view we can confirm that the log entry still reflects that the
custom payload claim is invalid, but this time a `200` response is logged
instead of the previously `400` one, and this is because Approov is now disabled.


#### /v2/forms - Valid Custom Payload Claim in the Approov token

Make sure that the `.env` file contains `APPROOV_ABORT_REQUEST_ON_INVALID_TOKEN`
and `APPROOV_ABORT_REQUEST_ON_INVALID_CUSTOM_PAYLOAD_CLAIM` set to `true`.

Cancel current server session with `ctrl+c` and start it again with:

```bash
npm start
```

**Postman view:**

![Postman - forms endpoint with valid custom payload claim](./assets/img/postman-forms-valid-custom-payload-claim.png)

**Shell view:**

![Shell - forms endpoint with valid custom payload claim](./assets/img/shell-forms-valid-custom-payload-claim.png)

**Request Overview:**

In the Postman view the Approov token header contains a valid custom payload
claim, thus when we perform the request the API server doesn't reject it and a
`200` response is sent back.

The shell view confirms us that the custom payload claim is valid and we can
also see the log entry confirming the `200` response.
