# syntax=docker/dockerfile:1
# as the entrypoint used both locally and when deployed via Docker.
FROM node:24-bookworm-slim

ENV APP_HOME=/workspace \
    RUN_MODE=container

WORKDIR /app

COPY . .

RUN npm install

# Provide APP_START_CMD via --env-file.
CMD ["bash", "scripts/build.sh"]
