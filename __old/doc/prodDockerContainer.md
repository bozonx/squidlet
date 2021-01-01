# Build and start production docker image.

### Build image

    yarn buildProdImage-x86 [--minimize=false]
    yarn buildProdImage-rpi [--minimize=false]
    yarn buildProdImage-arm [--minimize=false]

### Run image on x86 machine

    docker rm -f squidlet; docker run --name squidlet -ti \
      -p 8087:8087 \
      -p 8088:8088 \
      -p 8089:8089 \
      -v path/to/data:/app/data \
      -e PUID=1000 \
      -e PGID=1000 \
      -e LOG_LEVEL=info \
      -e MQTT_BROKER_HOST='localhost' \
      -e MQTT_BROKER_PORT=1234 \
      --device=/dev/ttyUSB0 \
      bozonx/squidlet:x86

    docker rm -f squidlet; docker run --name squidlet -ti \
      -p 8087:8087 \
      -p 8088:8088 \
      -p 8089:8089 \
      -e PUID=1000 \
      -e PGID=1000 \
      -e LOG_LEVEL=debug \
      bozonx/squidlet:x86

### Run image on Raspberry pi like machine

    docker rm -f squidlet; docker run --name squidlet -ti \
      -p 8087:8087 \
      -p 8088:8088 \
      -p 8089:8089 \
      -v path/to/data:/app/data \
      -e PUID=1000 \
      -e PGID=1000 \
      -e LOG_LEVEL=info \
      -e MQTT_BROKER_HOST='localhost' \
      -e MQTT_BROKER_PORT=1234 \
      --device=/dev/ttyUSB0
      bozonx/squidlet:x86

    docker rm -f squidlet; docker run --name squidlet -ti \
      -p 8087:8087 \
      -p 8088:8088 \
      -p 8089:8089 \
      -v /home/pi/workdirs/squidlet:/app/data \
      -e LOG_LEVEL=debug \
      bozonx/squidlet:rpi

## Pigpiod

Prefer the docker's way.

### Pigpio docker container

Build/update the image

    yarn buildPigpio

Start

    docker rm -f pigpio; docker run --name pigpio -it -p 8888:8888 --privileged --device /dev/mem bozonx/pigpio

If you have problems try the next params:

    --cap-add=SYS_ADMIN
    -v /sys/class/gpio:/sys/class/gpio
    -v /dev/mem:/dev/mem

### Install on system

    sudo apt-get install pigpio

#### Control pigpiod daemon

Run in foreground

    sudo pigpiod -g
 
Start as daemon

    sudo pigpiod

Stop a daemon

    sudo killall pigpiod

Or use systemd service `pigpiod`

    sudo systemctl enable pigpiod
    sudo systemctl start pigpiod
