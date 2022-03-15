#!/bin/bash

set -eu

CONTAINER_USER="$(id -u)"

HTTP_PORT=8002

function Show_Help
{
    echo && cat ./docker/usage-help.txt && echo
}

function Build_Docker_Image()
{
  sudo docker build -t approov/nodejs-express ./docker
}

function Create_Docker_Container
{
    local _command="${1:-zsh}"
    local _user="${2? Missing user name or uid for the container we want to stop!!!}"
    local _port="${3? Missing http port for the container we want to stop!!!}"
    local _server_name="${4? Missing server name for the container we want to stop!!!}"
    local _container_name="nodejs-express-${_server_name}"

    sudo docker run \
        -it \
        --rm \
        --user "${_user}" \
        --env-file .env \
        --env "SERVER_NAME=server/${_server_name}.js" \
        --env "HTTP_PORT=${_port}" \
        --name "${_container_name}" \
        --publish "127.0.0.1:${_port}:${_port}" \
        --workdir "/home/node/workspace" \
        --volume "$PWD:/home/node/workspace" \
        approov/nodejs-express ${_command}
}

function Stop_Docker_Container
{
    local _user="${1? Missing user name or uid for the container we want to stop!!!}"
    local _port="${2? Missing http port for the container we want to stop!!!}"
    local _server_name="${3? Missing server name for the container we want to stop!!!}"
    local _container_name="nodejs-express-${_server_name}"

    sudo docker container stop "${_container_name}"
}

for input in "${@}"
    do
        case "${input}" in
            build)
                Build_Docker_Image
                exit 0
                ;;
            -p | --port)
                HTTP_PORT="${2? Missing HTTP port to access the container in localhost}"
                shift 2
                ;;
            -u | --user)
                CONTAINER_USER="${2? Missing user name or uid to use inside the container}"
                shift 2
                ;;
            approov-protected-server)
                Create_Docker_Container "npm start" "${CONTAINER_USER}" "${HTTP_PORT}" "approov-protected-server"
                exit 0
                ;;
            original-server)
                Create_Docker_Container "npm run original-server" "${CONTAINER_USER}" "${HTTP_PORT}" "original-server"
                exit 0
                ;;
            stop)
                Stop_Docker_Container "${CONTAINER_USER}" "${HTTP_PORT}" "${2:-approov-protected-server}"
                exit 0
                ;;
            shell)
                Create_Docker_Container "${2:-zsh}" "${CONTAINER_USER}" "${HTTP_PORT}" "${3:-approov-protected-server}"
                exit 0
                ;;
            -h | --help)
                Show_Help
                exit 0
                ;;
        esac
done

Show_Help
