# Build

## Master

Master only runs on x86 or rpi platforms without building to js. It runs as is.
On build time:

* generates config for hosts
* collect paths to entities files
* run host system and pass to it configs and list of paths to entities files

    yarn master --config ./myMasterConfig.yaml
    

## Solid

It makes one file which includes host system, config, entities files, and platform's files.
It builds for all types of platforms. It isn't slave - it doesn't receive system or config from master
but it support networking with other hosts.

On build time:

* generate host's configs and entities files
* merges index file, host configs, host entities and system

    yarn solid --name myHostId --config ./myHostConfig.yaml
