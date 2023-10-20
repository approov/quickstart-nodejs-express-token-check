ARG TAG=18-slim
FROM node:${TAG}

ARG CONTAINER_USER="node"
ARG LANGUAGE_CODE="en"
ARG COUNTRY_CODE="GB"
ARG ENCODING="UTF-8"

ARG LOCALE_STRING="${LANGUAGE_CODE}_${COUNTRY_CODE}"
ARG LOCALIZATION="${LOCALE_STRING}.${ENCODING}"

ARG OH_MY_ZSH_THEME="bira"

RUN apt update && apt -y upgrade && \
    apt -y install \
        locales \
        git \
        curl \
        inotify-tools \
        zsh && \

        echo "${LOCALIZATION} ${ENCODING}" > /etc/locale.gen && \
        locale-gen "${LOCALIZATION}" && \

        # useradd -m -u 1000 -s /usr/bin/zsh "${CONTAINER_USER}" && \

        bash -c "$(curl -fsSL https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" && \

        cp -v /root/.zshrc /home/"${CONTAINER_USER}"/.zshrc && \
        cp -rv /root/.oh-my-zsh /home/"${CONTAINER_USER}"/.oh-my-zsh && \
        sed -i "s/\/root/\/home\/${CONTAINER_USER}/g" /home/"${CONTAINER_USER}"/.zshrc && \
        sed -i s/ZSH_THEME=\"robbyrussell\"/ZSH_THEME=\"${OH_MY_ZSH_THEME}\"/g /home/${CONTAINER_USER}/.zshrc

USER ${CONTAINER_USER}

ENV USER ${CONTAINER_USER}
ENV LANG "${LOCALIZATION}"
ENV LANGUAGE "${LOCALE_STRING}:${LANGUAGE_CODE}"
ENV PATH=/home/${CONTAINER_USER}/.local/bin:${PATH}
ENV LC_ALL "${LOCALIZATION}"

RUN mkdir -p /home/${CONTAINER_USER}/workspace

WORKDIR /home/${CONTAINER_USER}/workspace

# Copy app source into the docker image with the correct ownership
COPY --chown=${CONTAINER_USER}:${CONTAINER_USER} approov-protected-server.js .
COPY --chown=${CONTAINER_USER}:${CONTAINER_USER} package.json .
COPY --chown=${CONTAINER_USER}:${CONTAINER_USER} package-lock.json .

RUN pwd && ls -laR && npm install

CMD ["zsh"]
