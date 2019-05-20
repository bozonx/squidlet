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

    squidletctl log --host [--port=8889]
    
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used


## Publish and subscript to remote events
Publish

    squidletctl pub --host --category="myCategory" [--topic] [--data] [--port=8889]
    
Subscribe
    
    squidletctl sub --host --category="myCategory" [--topic] [--port=8889]

* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --category - category of event
* --topic - topic of event
* --data - data to send in json format


## ????? Run IO server

Os server starts independently from host.
System can connect to It via websocket and manipulate IO devices which IO server serves.
It especially suitable for development to run IO server e.g on raspberry pi and connect to it
from your laptop where development version of System is being running.

    squidletctl io-server [--machine=x86 | rpi] [--host=localhost] [--port=8889] [--verbose=true]

### Parameters

* --machine can be x86 or rpi. It means which machine is used.
  It tries recognize it if this argument isn't set
* --host - host where websocket server will be run. Default is localhost
* --port - port of websocket server. Default if 8889
* --verbose - print incoming messages if true
