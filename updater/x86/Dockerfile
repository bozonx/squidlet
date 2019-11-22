FROM node:13.1.0

COPY build/updaterX86/index.js app/updater.js
COPY updater/start.js app/start.js
COPY updater/package.json app/package.json

ENV PUID=1000 PGID=1000 MQTT_BROKER_HOST="" MQTT_BROKER_PORT=""

WORKDIR /app

#USER root

#RUN npm install -g \
#  axios \
#  mqtt \
#  mqtt-packet \
#  ws;

RUN npm install;

COPY updater/docker-entrypoint.sh /usr/local/bin/
VOLUME ["/app/data"]
EXPOSE 8087/tcp 8088/tcp 8089/tcp
ENTRYPOINT [ "docker-entrypoint.sh" ]
#CMD [ "node", "start.js" ]
CMD [ "npm", "start" ]
