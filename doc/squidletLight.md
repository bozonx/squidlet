# Squidlet light

It is builder which builds squidlet project to one file. Which includes host config, system and entities.

## How to build

    cd ./squidletLight
    ./squidletLight.sh --platform=nodejs [...params] ./myConfig.yaml

## Params

* --platform - required. E.g nodejs
* --machine - required. E.g rpi, x86
* --work-dir - optional. default is the build dir of repository
* --minimize=true - default is true
* --io-server=false - build IO server standalone instead of full app. Default is false
* --log-level - Optional. Set log level for logger. debug|info|warn|error. By default not set.
