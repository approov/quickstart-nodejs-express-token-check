# Approov Integrations Examples

[Approov](https://approov.io) is an API security solution used to verify that requests received by your backend services originate from trusted versions of your mobile apps, and here you can find the Hello servers examples that are the base for the Approov [quickstarts](/docs) for the NodeJS Express framework.

For more information about how Approov works and why you should use it you can read the [README](/README.md) at the root of this repo.

If you are looking for the Approov quickstarts to integrate Approov in your NodeJS Express API server then you can find them [here](/docs).


## Hello Server Examples

To learn more about each Hello server example you need to read the README for each one at:

* [Unprotected Server](./src/unprotected-server)
* [Approov Protected Server - Token Check](./src/approov-protected-server/token-check)
* [Approov Protected Server - Token Binding Check](./src/approov-protected-server/token-binding-check)


## Docker Stack

The docker stack provided via the `docker-compose.yml` file in this folder is used for development proposes and if you are familiar with docker then feel free to also use it to follow along the examples on the README of each server.

If you decide to use the docker stack then you need to bear in mind that the Postman collections, used to test the servers examples, will connect to port `8002` therefore you cannot start all docker compose services at once, for example with `docker-compose up`, instead you need to run one at a time as exemplified below.

### Setup Env File

Do not forget to properly setup the `.env` file in the root of each Approov protected server example before you run the server with the docker stack.

```bash
cp src/approov-protected-server/token-check/.env.example .env
cp src/approov-protected-server/token-binding-check/.env.example .env
```

Edit each file and add the [dummy secret](/README.md#the-dummy-secret) to it in order to be able to test the Approov integration with the provided [Postman collection](https://github.com/approov/postman-collections/blob/master/quickstarts/hello-world/hello-world.postman_curl_requests_examples.md).

### Command Examples

To run each of the Hello servers with docker compose you just need to follow the respective example below.

#### For the unprotected server

Run the container attached to your machine bash shell:

```bash
sudo docker-compose up unprotected-server
```

or get a bash shell inside the container:

```bash
sudo docker-compose run --rm --service-ports unprotected-server
```

#### For the Approov Token Check

Run the container attached to the shell:

```bash
sudo docker-compose up approov-token-check
```

or get a bash shell inside the container:

```bash
sudo docker-compose run --rm --service-ports approov-token-check
```

#### For the Approov Token Binding Check

Run the container attached to the shell:

```bash
sudo docker-compose up approov-token-binding-check
```

or get a bash shell inside the container:

```bash
sudo docker-compose run --rm --service-ports approov-token-binding-check
```

## Support

If you find any issue while following this quickstart then just open an issue on this repo with the steps to reproduce it and we will help you to solve them.
