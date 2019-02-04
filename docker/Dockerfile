FROM ubuntu:18.04

# Inspired on:
#   → https://github.com/Purik/android-studio-docker
#   → https://github.com/Deadolus/android-studio-docker

ARG CONTAINER_USER="node"
ARG CONTAINER_UID="1000"
ARG DISPLAY=":0.0"
ARG ZSH_THEME="robbyrussell"

# Will not prompt for questions
ENV DEBIAN_FRONTEND=noninteractive \
    CONTAINER_USER=node \
    CONTAINER_UID=1000 \
    ROOT_CA_DIR=/root-ca/ \
    PROXY_CA_FILENAME="FirewallProxyCA.crt" \
    PROXY_CA_PEM="certificates/FirewallProxyCA.crt" \
    PROXY_CA_NAME="FirewallProxyCA" \
    DISPLAY=${DISPLAY} \
    NO_AT_BRIDGE=1

# NO_AT_BRIDGE=1
# Removes DBUS warning that should be only seen by Developer
# https://bugs.launchpad.net/ubuntu/+source/at-spi2-core/+bug/1193236

COPY ./setup ${ROOT_CA_DIR}

RUN apt update && \
    apt -y upgrade && \
    apt -y install \
      locales \
      tzdata \
      ca-certificates \
      inotify-tools \
      libnss3-tools \
      curl \
      git \
      zsh \
      unzip \
      nodejs \
      npm \
      libxss1 && \

    locale-gen en_GB.UTF-8 && \
    dpkg-reconfigure locales && \

    # https://github.com/guard/listen/wiki/Increasing-the-amount-of-inotify-watchers
    printf "fs.inotify.max_user_watches=524288\n" >> /etc/sysctl.conf && \

    # add unprivileged user
    useradd -m -u ${CONTAINER_UID} -s /bin/bash ${CONTAINER_USER} && \

    # Useful when running behind a corporate firewall or a proxy
    cd ${ROOT_CA_DIR} && \
    ./add-proxy-certificate.sh "${PROXY_CA_PEM}" && \
    ./add-certificate-to-node-server.sh "/etc/ssl/certs/${PROXY_CA_NAME}.pem" && \

    # Install Oh My Zsh for Root and Node user
    bash -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" && \
    chsh -s /usr/bin/zsh && \
    cp -R /root/.oh-my-zsh /home/"${CONTAINER_USER}" && \
    cp /root/.zsh* /home/"${CONTAINER_USER}" && \
    sed -i "s/\/root/\/home\/${CONTAINER_USER}/g" /home/"${CONTAINER_USER}"/.zshrc && \
    chown -R "${CONTAINER_USER}":"${CONTAINER_USER}" /home/"${CONTAINER_USER}" && \
    echo PATH=/opt/android-studio/bin:$PATH >> /home/${CONTAINER_USER}/.bashrc && \
    echo PATH=/opt/android-studio/bin:$PATH >> /home/${CONTAINER_USER}/.zshrc && \
    sed -i s/ZSH_THEME=\"robbyrussell\"/ZSH_THEME=\"${ZSH_THEME}\"/g /home/${CONTAINER_USER}/.zshrc && \

    # Install node in a more current version
    curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt install -y nodejs

ENV LANG=en_GB.UTF-8 \
    LANGUAGE=en_GB:en \
    LC_ALL=en_GB.UTF-8

USER ${CONTAINER_USER}

WORKDIR /home/${CONTAINER_USER}/workspace

EXPOSE 5000

CMD ["zsh"]
