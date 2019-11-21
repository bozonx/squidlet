FROM node:13.1.0

# Copy files
COPY ..build/updater/ updater/

ENV PUID=1000
ENV PGID=1000

#USER node

COPY docker-entrypoint.sh /usr/local/bin/
VOLUME ["/data"]
WORKDIR /updater
EXPOSE 3080/tcp
ENTRYPOINT [ "docker-entrypoint.sh" ]
CMD [ "node", "/updater/index.js" ]
#CMD [ "npm", "start" ]
