# Squidlet

Easy make IoT devices and local net of devices which can be managed by master


## Build host's files

    yarn build-host


## Lowjs

### Build devs

   yarn build-lowjs-devs

### ESP32 wrover

    yarn build --config=./my-host.yaml


## Nodejs
 
### raspberry pi

    sudo apt-get update
    sudo apt-get install pigpio
    
    cd nodejs
    yarn
    
    cd ..
    
    yarn master


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
    
