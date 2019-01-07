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
    ROOT_CA_KEY="self-signed-root-ca.key" \
    ROOT_CA_PEM="self-signed-root-ca.pem" \
    ROOT_CA_NAME="ApproovStackRootCA" \
    PROXY_CA_FILENAME="ProxyCA.crt" \
    PROXY_CA_PEM="certificates/ProxyCA.crt" \
    PROXY_CA_NAME="FirewallProxy" \
    DISPLAY=${DISPLAY} \
    NO_AT_BRIDGE=1

# NO_AT_BRIDGE=1
# Removes DBUS warning that should be only seen by Developer
# https://bugs.launchpad.net/ubuntu/+source/at-spi2-core/+bug/1193236

COPY ./setup ${ROOT_CA_DIR}
COPY ./.mozilla /root/.mozilla
COPY ./postman-config /root/postman-config

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
      nano \
      firefox \
      libxss1 \
      libgconf-2-4 \
      dbus* \
      libcanberra-gtk* && \

    locale-gen en_GB.UTF-8 && \
    dpkg-reconfigure locales && \

    #https://github.com/guard/listen/wiki/Increasing-the-amount-of-inotify-watchers
    printf "fs.inotify.max_user_watches=524288\n" >> /etc/sysctl.conf && \

    useradd -m -u ${CONTAINER_UID} -s /bin/bash ${CONTAINER_USER} && \

    mv /root/.mozilla /home/${CONTAINER_USER}/.mozilla && \
    chown -R ${CONTAINER_USER}:${CONTAINER_USER} /home/${CONTAINER_USER}/.mozilla && \

    mkdir -p /home/${CONTAINER_USER}/.config && chown ${CONTAINER_USER}:${CONTAINER_USER} /home/${CONTAINER_USER}/.config && \
    mv /root/postman-config /home/${CONTAINER_USER}/.config/Postman && \
    chown -R ${CONTAINER_USER}:${CONTAINER_USER} /home/${CONTAINER_USER}/.config && \

    cd ${ROOT_CA_DIR} && \
    ./setup-root-certificate.sh "${ROOT_CA_KEY}" "${ROOT_CA_PEM}" "${ROOT_CA_NAME}" && \
    ./create-domain-certificate.sh "localhost" "${ROOT_CA_KEY}" "${ROOT_CA_PEM}" && \
    ./add-proxy-certificate.sh "${PROXY_CA_PEM}" && \
    ./add-certificate-to-browser.sh "${ROOT_CA_PEM}" "${ROOT_CA_NAME}" && \
    ./add-certificate-to-browser.sh "${PROXY_CA_PEM}" "${PROXY_CA_NAME}" && \
    mkdir /home/${CONTAINER_USER}/.ssl && \
    cp -v localhost.crt /home/${CONTAINER_USER}/.ssl/localhost.pem && \
    cp -v localhost.key /home/${CONTAINER_USER}/.ssl/localhost.key && \
    chmod 644 /home/${CONTAINER_USER}/.ssl/localhost.key && \
    ./add-certificate-to-node-server.sh "/etc/ssl/certs/ProxyCA.pem" && \

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

    curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt install -y nodejs && \

    curl https://snapshots.mitmproxy.org/4.0.4/mitmproxy-4.0.4-linux.tar.gz -o mitmproxy.tar.gz && \
    tar -zxvf mitmproxy.tar.gz -C /usr/local/bin && \
    rm -rfv mitmproxy.tar.gz && \

    curl https://dl.pstmn.io/download/latest/linux64 -o postman.tar.gz && \
    tar -xzf postman.tar.gz -C /opt && \
    rm -rfv postman.tar.gz && \
    ln -s /opt/Postman/Postman /usr/bin/postman

ENV LANG=en_GB.UTF-8 \
    LANGUAGE=en_GB:en \
    LC_ALL=en_GB.UTF-8

USER ${CONTAINER_USER}

WORKDIR /home/${CONTAINER_USER}/workspace

CMD ["zsh"]
