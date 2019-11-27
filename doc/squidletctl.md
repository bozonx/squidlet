# Squidlet control script

## Update hosts

Update host

    squidletctl update --light=true [--work-dir] --host=my-host [--port=8088] ./hostConfig.yaml
    
Params:

* --light=true - Mandatory. Only light mode is supported at the moment. If true it make a bundle
  which will be uploaded to the host.
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --work-dir - path to dir where hosts and tmp files will be placed
* ./hostConfig.yaml - it is path to host config yaml file.

?????
  By default it is under $SQUIDLET_ROOT dir
* SQUIDLET_ROOT is an env variable points to root where hosts' files and builds are placed

## Start x86/arm/raspberry pi host on nodejs
 
### Start production host

Sys and entities are rebuilt each time you start prod build. Node modules are installed
only first time or if `--force` parameter is set.

    squidletctl start
      --prod=true
      [--machine=x86 | arm | rpi]
      [--work-dir]
      [--name]
      [--force=true]
      [--log-level=debug|info|warn|error]
      [--user=username]
      [--group=groupname]
      ./groupOrHostConfig.yaml

### Start development host

    squidletctl start
      [--machine=x86 | arm | rpi]
      [--work-dir]
      [--name]
      [--force=true]
      [--log-level=debug|info|warn|error]
      [--user=username]
      [--group=groupname]
      [--ioset=localhost:8089]
      ./groupOrHostConfig.yaml
      
### Start development host on your machine and use remote io set on micro-controller or remote host.

    squidletctl start
      [--name]
      [--log-level=debug|info|warn|error]
      [--ioset=localhost:8089]
      ./groupOrHostConfig.yaml

* --ioset=localhost:8089 - connect to ioSet of remote host. You should allow it in config of remote host

### Start development io server

Start only io server which you can connect from your workstation for development purpose.
Config is optional, if it does not includes io definitions you don't have to specify a config.

    squidletctl io-server
      [--machine=x86 | arm | rpi]
      [--work-dir]
      [--name]
      [--force=true]
      [--log-level=debug|info|warn|error]
      [--user=username]
      [--group=groupname]
      [./groupOrHostConfig.yaml]

### Parameters

* --machine can be x86, arm or rpi. It tries recognize it automatically if this argument isn't set
* --prod=true - if set production version will be used instead. By default is development.
* --work-dir - set working dir for host where envset, data and tmp dirs will be placed.
  By default it uses $SQUIDLET_ROOT dir instead "build" of repository.
* --name uses only if group config is specified
  and selects a host config from group config
* --force - it runs `npm install` anyway
* --log-level - log level which will be used. It overrides a log level specified in a host config.
* --user - owner of files which will be written. It can be a user name or uid. It is optional
* --group - group of files which will be written, It can be a group name or uid. It is optional
* ./groupOrHostConfig.yaml - it is path to host config yaml file of group config.
  If group config is specified you should specify a host name (--name argument)
  instead the first host will be taken.

### Environment variables

* SQUIDLET_ROOT is an env variable points to root where hosts' files and builds are placed.
  By default isn't set.


## Call device's action

Call device action and print the result.

    squidletctl action <fullDeviceId> <actionName> [value1] [value2] ... --host=my-host [--port=8088]

    # example
    squidletctl action bedroom.switch turn true --host=remotehost

Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used


## Get device's status

    squidletctl status <fullDeviceId> --host=my-host [--port=8088] [--watch]
    
    # example
    squidletctl status bedroom.switch --host=remotehost
    
Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --watch - watch changes of status and print them.

## Get device's config

    squidletctl config <fullDeviceId> --host=my-host [--port=8088] [--watch]
    
    # example
    squidletctl config bedroom.switch --host=remotehost
    
Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --watch - watch changes of config and print them.

## Get state

    squidletctl state <category> <stateName> --host=my-host [--port=8088] [--watch]
    
    # example
    squidletctl state 0 bedroom.switch --host=remotehost

Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --watch - watch changes of state and print them.

## Reboot

Reboot the host.

    squidletctl reboot --host=my-host [--port=8088]
    
Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used

## Get host info

Get host config, system config and list of ios

    squidletctl info --host=my-host [--port=8088]
    
Params
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used

## Listen logs of remote host

    squidletctl log --host=my-host [--port=8088] [--level=info]
    
* --host - set remote host
* --port - set remote port. Is isn't set - default will be used
* --level - max level to listen to. Default is info

## Switch to io server

Switch app to io server for development purpose.
It reboot a micro-controller and boots to io-server mode.

    squidletctl switch-to-ioserver --host=my-host [--port=8089]

## Switch to io server

Switch io server to app.

    squidletctl switch-to-app --host=my-host [--port=8089]
