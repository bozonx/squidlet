# Squidlet

Easy make IoT devices and local net of devices which can be managed by master


## Build

### Build config

    CONFIG=./path/to/masterConfig.yaml BUILD_DIR=./my/dir yarn build-config

or

    yarn build-config --config=./path/to/masterConfig.yaml --build-dir=./my/dir


# Squidlet lowjs platform

## Machines

### ESP32 wrover

    yarn build --config=./my-host.yaml

## Build devs

   yarn build-devs
