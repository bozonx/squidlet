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


## Start x86 or raspberry pi host
 
### Start production host

    squidletctl start
      [--machine=x86 | rpi]
      [--prod=true]
      [--work-dir]
      [--name]
      [--ioset=ws:[host]:[port]]
      [--ioset-props={..jsonProps}]
      ./groupOrHostConfig.yaml

### Parameters

* --machine can be x86 or rpi. It means which machine is used.
  It tries recognize it if this argument isn't set
* --prod=true - if set then production version will be used instead development if isn't set
* --work-dir - set working dir for host where envset, data and tmp dirs will be placed.
  By default it is upder $SQUIDLET_ROOT dir
* SQUIDLET_ROOT is an env variable points to root where hosts' files and builds are placed
* --name uses only if group config is specified
  and selects a host config from group config
* --ioset - specify ioSet which will be used. Also you can specify host and port optionally
* --ioset-props - other ioSet props which will be passed to specified ioSet.
  These props will replace props in host config
* ./groupOrHostConfig.yaml - it is path to host config yaml file of group config.
  If group config is specified you should specify a host name (--name argument)
  instead the first host will be taken.
  
  
## Run IO server

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
