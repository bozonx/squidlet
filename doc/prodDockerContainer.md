# Build and start production docker image.

### Build image

    yarn buildImage

### Run image on x86 machine

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
      --privileged \
      --device=/dev/ttyUSB0 \
      bozonx/squidlet:x86

    docker rm -f squidlet; docker run --name squidlet -ti \
      -p 8087:8087 \
      -p 8088:8088 \
      -p 8089:8089 \
      -e PUID=1000 \
      -e PGID=1000 \
      -e LOG_LEVEL=debug \
      --privileged \
      --device=/dev/ttyUSB0 \
      bozonx/squidlet:x86

### Run image on Raspberry pi like machine

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
      --privileged \
      -v /sys/class/gpio:/sys/class/gpio \
      -v /dev/mem:/dev/mem \
      --device=/dev/ttyUSB0
      bozonx/squidlet:x86

    docker rm -f squidlet; docker run --name squidlet -ti \
      -p 18087:8087 \
      -p 18088:8088 \
      -p 18089:8089 \
      -e PUID=1000 \
      -e PGID=1000 \
      -e LOG_LEVEL=debug \
      --privileged \
      -v /sys/class/gpio:/sys/class/gpio \
      -v /dev/mem:/dev/mem \
      --device=/dev/ttyUSB0 \
      bozonx/squidlet:rpi

## Pigpiod

 * Control pigpiod:
 *
 * Run in foreground
 *     sudo pigpiod -g
 *
 * start a daemon
 *     sudo pigpiod
 *
 * stop a daemon
 *     sudo killall pigpiod