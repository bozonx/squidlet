# Squidlet control script

## Update hosts

Update all the hosts of group config

    squidletctl update [--work-dir] ./groupConfig.yaml

Update specified host of group config 

    squidletctl update myHost [--work-dir] ./groupConfig.yaml
    
Also you can specify the next params:

* ./groupOrHostConfig.yaml - it is path to host config yaml file of group config.
* --work-dir - path to dir where hosts and tmp files will be placed
  By default it is under $SQUIDLET_ROOT dir
* SQUIDLET_ROOT is an env variable points to root where hosts' files and builds are placed


### Group config yaml file

    # plugins which are common for each host
    plugins:
      - ./myPlugin.yaml
      
    # list of host config files
    hosts:
      - ./myHost.yaml

    hostDefaults:
      config:
        someParam: 1


## Start x86/arm/raspberry pi host on nodejs
 
### Start production host

    squidletctl start
      --prod=true
      [--machine=x86 | arm | rpi]
      [--work-dir]
      [--name]
      [--force=true]
      ./groupOrHostConfig.yaml

### Start development host

    squidletctl start
      [--machine=x86 | arm | rpi]
      [--work-dir]
      [--name]
      [--force=true]
      [--ioset=localhost:8889]
      ./groupOrHostConfig.yaml

### Parameters

* --machine can be x86, arm or rpi. It tries recognize it automatically if this argument isn't set
* --prod=true - if set production version will be used instead. By default is development.
* --work-dir - set working dir for host where envset, data and tmp dirs will be placed.
  By default it uses $SQUIDLET_ROOT dir instead "build" of repository.
* --name uses only if group config is specified
  and selects a host config from group config
* --force - in production it rebuilds system and installs npm modules.
   In development it installs npm modules.
* --ioset=localhost:8889 - connect to ioSet of remote host. You should allow it in this host
* ./groupOrHostConfig.yaml - it is path to host config yaml file of group config.
  If group config is specified you should specify a host name (--name argument)
  instead the first host will be taken.

### Environment variables

* SQUIDLET_ROOT is an env variable points to root where hosts' files and builds are placed.
  By default isn't set.


## Listen logs of remote host

    squidletctl log --host=my-host [--port=8889] [--level=info]
    
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --level - max level to listen to. Default is info


## Call device's action

Call device action and print the result.


    squidletctl action <fullDeviceId> <actionName> [value1] [value2] ... --host=my-host [--port=8889]

    # example
    squidletctl action bedroom.switch turn 1 --host=remotehost

Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used


## Get device's status

    squidletctl status <fullDeviceId> --host=my-host [--port=8889] [--watch]
    
    # example
    squidletctl status bedroom.switch --host=remotehost
    
Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --watch - watch changes of status and print them.

## Get device's config

    squidletctl config <fullDeviceId> --host=my-host [--port=8889] [--watch]
    
    # example
    squidletctl config bedroom.switch --host=remotehost
    
Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --watch - watch changes of config and print them.

## Get state

    squidletctl state <category> <stateName> --host=my-host [--port=8889] [--watch]
    
    # example
    squidletctl state 0 bedroom.switch --host=remotehost
        
Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --watch - watch changes of state and print them.

## Get host config

    squidletctl host-config --host=my-host [--port=8889]
    
Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used

## Get host info

    squidletctl host-info --host=my-host [--port=8889]
    
Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
