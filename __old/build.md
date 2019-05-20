# Build

## Master

Master only runs on x86 or rpi platforms without building to js. It runs as is.
At a build time:

* generates config for hosts
* collect paths to entities files
* run host system and pass to it configs and list of paths to entities files

    squidlet master --config ./myMasterConfig.yaml
    

## Solid

It makes one file which includes host system, config, entities files, and platform's files.
It builds for all types of platforms. It isn't slave - it doesn't receive system or config from master
but it support networking with other hosts.
At a build time:

* generate host's configs and entities files
* merges index file, host configs, host entities and system

    squidlet solid --name myHostId --config ./myHostConfig.yaml

# Slave

Slave receives config from master and updates system from it.
Basically slave build is only code which be able get a config from the closest gateway or master.
At a build time:

* parse master config and read slave config and gets a network configuration from it
* merges network config with slave index file

    squidlet slave --name myHostId --config ./masterConfig.yaml
