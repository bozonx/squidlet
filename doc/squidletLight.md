# Squidlet light

It is builder which builds squidlet project to one file. Which includes host config, system and entities.

## How to build

    cd ./squidletLight
    ./squidletLight.sh --platform=nodejs [...params] ./myConfig.yaml

## Params

Required params:

* --platform - required. E.g nodejs
* --machine - required. E.g rpi, x86

Optional Params:

* --name uses only if group config is specified and selects a host config from group config
* --output-dir - path to output dir where `bundle.js`m `bundle.sum` and `package.json` will be placed
* --minimize=true - default is true
* --io-server=false - build IO server standalone instead of full app. Default is false
* --log-level - Set log level for logger. debug|info|warn|error. By default not set.
