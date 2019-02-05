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

# Run squidlet on a raspberry pi

    sudo apt-get update
    sudo apt-get install pigpio


## Build cluster

Config looks like that:

    # List of common plugins
    plugins:
      - /path/to/plugin.ts
      
    # Default host config which will be merged to each host
    hostDefaults:
      devices:
        ...some devices definitions
    
    # Hosts configs by host id
    hosts:
      hostOne: ./hostOne.yaml

Build it

    yarn build-cluster --config=./path/to/clusterConfig.yaml --build-dir=./my/dir
    
