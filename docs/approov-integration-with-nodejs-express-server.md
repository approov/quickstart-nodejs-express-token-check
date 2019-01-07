# APPROOV INTEGRATION WITH NODEJS EXPRESS SERVER

This walk-through will consist of a quick start guide and an example integration
for an API server.

The quick start guide consists of small snippets of code that show how to use 
the NPM package Approov Token Check for integrating the Approov Token 
verification process in your current app.

The example integration for an API server is coded in NodeJS and Express and is
called the Approov Shapes Demo server. This a full working API server that let 
us see a complete integration of Approov in active and passive mode.


## APPROOV VALIDATION PROCESS

API calls protected by Approov will typically include a header holding an Approov
token. This token must be checked to ensure it has not expired and that it is
properly signed with the secret shared between the backend and the Approov cloud
service.

In Node-Express, these checks are best implemented as middleware and we provide
a NPM package that takes this approach and handles the validation and responses
on failure. For developers wanting more control they can pass in custom
callbacks, that allow to take control of the flow of the response on failure.


## HOW TO INTEGRATE APPROOV

* [Quick Start Guide](./quick-start-guide.md)
* [Approov Shapes Demo Server](./approov-shapes-demo-server.md)
