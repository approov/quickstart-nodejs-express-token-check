# NODE EXPRESS - APPROOV INTEGRATION

This repository contains a Docker stack that aims to show how to integrate 
Approov with a NodeJS Express server with the Approov Shapes Demo Server.


## INSTALL

```bash
git clone git@gitlab.com:prgs/nodejs-on-docker.git shapes-demo && \
cd shapes-demo && \
git checkout docs && \
git clone git@gitlab.com:prgs/nodejs-approov-token-check.git packages/approov-token-check && \
cd packages/approov-token-check && \
git checkout dev-midlleware && \
cd ../../
```

## HOW TO INTEGRATE APPROOV

* **[HOME](./docs/approov-integration-with-nodejs-express-server.md)**
  + [Quick Start Guide](./docs/quick-start-guide.md)
  + [Approov Shapes Demo Server](./docs/approov-shapes-demo-server.md)
