# DEPLOYMENT

Guide to deploy the NodeJS Express backend into a production demo server.

For now this will be a small set of manual steps, but later we may want to automate this via the CI pipeline, by building the docker image and the mobile app binary for the release.

## CLONE

```bash
git clone https://github.com/approov/quickstart-nodejs-express-token-check.git
cd quickstart-nodejs-express-token-check/servers/shapes-api
```

## ENVIRONMENT

Copy the `.env.example`:

```bash
cp .env.example .env
```

### The Approov secret

The `v2/*` endpoints are protected by the Approov Token, thus we need to set the Approov secret for `nodejs-express-shapes.approov.io`.

From your office computer, not the server, get the Approov secret with:

```bash
approov secret -get base64
```

Add it to the `.env` file:

```bash
APPROOV_BASE64_SECRET=approov-base64-encoded-secret-here
```

## HOW TO RUN

### Build the Docker Container

```bash
sudo docker-compose build
```

### Install the NodeJS dependencies

``` bash
sudo docker-compose run --rm node bash -c 'npm install'
```

### Bring the API up

```bash
sudo docker-compose up -d
```

### Bring the API down

```bash
sudo docker-compose down
```

### Check the Logs

```bash
sudo docker-compose logs --follow --tail 20
```
