# Squidlet

Easy make IoT devices and local net of devices which can be managed by master


## Nodejs
 
### Start production host

x86 machine

    npm run x86-prod [--name] ./groupOrHostConfig.yaml
    
Raspberry pi

    npm run rpi-prod [--name] ./groupOrHostConfig.yaml

### Start development host
 
x86 machine

    npm start [--name] ./groupOrHostConfig.yaml
    
Raspberry pi

    npm run rpi-dev [--name] ./groupOrHostConfig.yaml

### Parameters

* ./groupOrHostConfig.yaml - it is path to host config yaml file of group config.
  If group config is specified you should specify a host name (--name argument)
  instead the first host will be taken.
* SQUIDLET_ROOT env variable points to root where hosts' file and builds are placed
* --name uses only if group config is specified
  and selects a host config from group config
