FROM ubuntu:18.04

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
    PROXY_CA_NAME="FirewallProxy"

# Inspired on:
#   → https://github.com/Purik/android-studio-docker
#   → https://github.com/Deadolus/android-studio-docker

# Removes DBUS warning that should be only seen by Developer
# https://bugs.launchpad.net/ubuntu/+source/at-spi2-core/+bug/1193236
ENV NO_AT_BRIDGE=1

# Will not prompt for questions
ENV DEBIAN_FRONTEND=noninteractive

ARG CONTAINER_USER="${CONTAINER_USER:-node}"
ARG CONTAINER_UID="${CONTAINER_UID:-1000}"

COPY ./setup ${ROOT_CA_DIR}
COPY ./.mozilla /root/.mozilla

RUN apt update && \
    apt -y upgrade && \
    apt -y install \
      locales \
      tzdata \
      ca-certificates \
      inotify-tools \
      libnss3-tools \
      curl \
      # apt-utils \
      git \
      zsh \
      unzip \
      #mitmproxy \
      nodejs \
      npm \
      # nginx \
      # xorg \
      nano \
      # ant \
      firefox \
      # build-essential \
      dbus* \
      libcanberra-gtk*
      # bridge-utils \
      #libnotify4 \

RUN locale-gen en_GB.UTF-8 && \
    dpkg-reconfigure locales && \

    #https://github.com/guard/listen/wiki/Increasing-the-amount-of-inotify-watchers
    printf "fs.inotify.max_user_watches=524288\n" >> /etc/sysctl.conf && \

    useradd -m -u ${CONTAINER_UID} -s /bin/bash ${CONTAINER_USER} && \

    mv /root/.mozilla /home/${CONTAINER_USER}/.mozilla && \
    chown -R ${CONTAINER_USER}:${CONTAINER_USER} /home/${CONTAINER_USER}/.mozilla && \

    cd ${ROOT_CA_DIR} && \
    ./setup-root-certificate.sh "${ROOT_CA_KEY}" "${ROOT_CA_PEM}" "${ROOT_CA_NAME}" && \
    ./create-domain-certificate.sh "localhost" "${ROOT_CA_KEY}" "${ROOT_CA_PEM}" && \
    ./add-proxy-certificate.sh "${PROXY_CA_PEM}" && \
    ./add-certificate-to-browser.sh "${ROOT_CA_PEM}" "${ROOT_CA_NAME}" && \
    ./add-certificate-to-browser.sh "${PROXY_CA_PEM}" "${PROXY_CA_NAME}" && \
    mkdir /home/${CONTAINER_USER}/.ssl && \
    # cp -v ${ROOT_CA_DIR}/${ROOT_CA_PEM} /var/www/html/root-ca.pem && \
    # cp -v ${ROOT_CA_DIR}/localhost.crt /var/www/html/localhost.pem && \
    # cp -v ${ROOT_CA_DIR}/${PROXY_CA_PEM} /var/www/html/proxy.crt && \
    cp -v localhost.crt /home/${CONTAINER_USER}/.ssl/localhost.pem && \
    cp -v localhost.key /home/${CONTAINER_USER}/.ssl/localhost.key && \
    chmod 644 /home/${CONTAINER_USER}/.ssl/localhost.key
    #./add-certificate-to-node-server.sh "/etc/ssl/certs/ProxyCA.pem" && \

    # Install Oh My Zsh for Root and Node user
RUN bash -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" && \
    chsh -s /usr/bin/zsh && \
    cp -R /root/.oh-my-zsh /home/"${CONTAINER_USER}" && \
    cp /root/.zsh* /home/"${CONTAINER_USER}" && \
    sed -i "s/\/root/\/home\/${CONTAINER_USER}/g" /home/"${CONTAINER_USER}"/.zshrc && \
    chown -R "${CONTAINER_USER}":"${CONTAINER_USER}" /home/"${CONTAINER_USER}" && \
    echo PATH=/opt/android-studio/bin:$PATH >> /home/${CONTAINER_USER}/.bashrc && \
    echo PATH=/opt/android-studio/bin:$PATH >> /home/${CONTAINER_USER}/.zshrc && \
    sed -i s/ZSH_THEME=\"robbyrussell\"/ZSH_THEME=\"bira\"/g /home/${CONTAINER_USER}/.zshrc

RUN curl -sL https://deb.nodesource.com/setup_10.x | bash - && \
    apt install -y nodejs

# RUN curl https://snapshots.mitmproxy.org/4.0.4/mitmproxy-4.0.4-linux.tar.gz -o mitmproxy.tar.gz && \
#     tar -zxvf mitmproxy.tar.gz -C /usr/local/bin && \
#     rm -rfv mitmproxy.tar.gz

RUN ./${ROOT_CA_DIR}/add-certificate-to-node-server.sh "/etc/ssl/certs/ProxyCA.pem"

ARG DISPLAY=${DISPLAY:-":0.0"}
ENV DISPLAY=${DISPLAY}

ENV LANG en_GB.UTF-8
ENV LANGUAGE en_GB:en
ENV LC_ALL en_GB.UTF-8

EXPOSE 80
EXPOSE 443

USER ${CONTAINER_USER}

WORKDIR /home/${CONTAINER_USER}/workspace

CMD ["zsh"]
