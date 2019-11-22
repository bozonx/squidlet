
### Build image

    yarn buildImage

### Run image

    docker rm -f squidlet; docker run --name squidlet -ti \
      -p 8087:8087 \
      -p 8088:8088 \
      -p 8089:8089 \
      -v path/to/data:/data \
      -e PUID=1000 \
      -e PGID=1000 \
      -e LOG_LEVEL=info \
      -e MQTT_BROKER_HOST='localhost' \
      -e MQTT_BROKER_PORT=1234 \
      bozonx/squidlet:x86

    docker rm -f squidlet; docker run --name squidlet -ti \
      -p 8087:8087 \
      -p 8088:8088 \
      -p 8089:8089 \
      -e PUID=1000 \
      -e PGID=1000 \
      -e LOG_LEVEL=info \
      bozonx/squidlet:x86
      