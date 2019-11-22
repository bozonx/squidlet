FROM node:13.1.0

COPY ../../build/app/index.js app/updater.js
COPY ../start.js app/start.js

ENV PUID=1000
ENV PGID=1000
ENV MQTT_BROKER_HOST=""
ENV MQTT_BROKER_PORT=""

COPY ../docker-entrypoint.sh /usr/local/bin/
VOLUME ["/data"]
WORKDIR /app
EXPOSE 8087/tcp 8088/tcp 8089/tcp
ENTRYPOINT [ "docker-entrypoint.sh" ]
CMD [ "node", "start.js" ]
