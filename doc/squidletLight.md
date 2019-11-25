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

* --tmp-dir - default is the build dir of repository
* --output - path to output js bundle. By default it is `index.js` in work dir.
* --minimize=true - default is true
* --io-server=false - build IO server standalone instead of full app. Default is false
* --log-level - Set log level for logger. debug|info|warn|error. By default not set.
* --only-used-io=false - If true then only that IOs will be put into bundle which are used by entities.
  It works only in app mode not IO server mode.
