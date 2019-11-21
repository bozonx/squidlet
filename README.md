# Squidlet

Easy make IoT devices and local net of devices which can be managed by master

## Use Docker image

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
      bozonx/squidlet
