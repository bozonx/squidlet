# Squidlet control script

## Update host

Update all the hosts of group config

    squidlet update ./groupConfig.yaml

Update specified host of group config 

    squidlet update myHost ./groupConfig.yaml
    
Also you can specify next params:

* --build-dir or BUILD_DIR env variable - path to dir where hosts files will be placed
* --tmp-dir or TMP_DIR env variable - path to dir where temporary will be placed 


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
