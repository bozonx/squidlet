# Squidlet

Easy make IoT devices and local net of devices which can be managed by master


## Environment variables

* ROOT_DIR - if set then it will be a default root dir for all the other dirs.
  It can be absolute or relative to PWD
* FILES_UID - uid for all the files on unix-like systems
* FILES_GID - gid for all the files on unix-like systems

You can overwrite some dir paths. Set absolute or PWD relative path.
For production please prefer absolute paths.
By default, these paths will be under ROOT_DIR.

* APP_FILES_DIR - path to dir `/appFiles`
* APP_DATA_LOCAL_DIR - path to dir `/appDataLocal`
* APP_DATA_SYNCED_DIR - path to dir `/appDataSynced`
* CACHE_LOCAL_DIR - path to dir `/cacheLocal`
* CFG_LOCAL_DIR - path to dir `/cfgLocal`
* CFG_SYNCED_DIR - path to dir `/cfgSynced`
* DB_DIR - path to dir `/db`
* LOG_DIR - path to dir `/log`
* TMP_LOCAL_DIR - path to dir `/tmp`
* USER_HOME_DIR - path to dir `/home`
* EXT_DIRS - JSON object which specifies external dirs which are pointed to any
  external dir of local system. Like EXT_DIRS='{"myExtDir": "/home/userName/Downloads"}'.
  They have to be absolute. To call it use `/external/myExtDir/someFile.jpg`

## File structure

* `/appFiles` - app files after install are put here. They will be readonly
  * `/[appName]`
* `/appDataLocal` - apps data which is only for current machine
  * `/[appName]`
  * `/system` - for system services and drivers
* `/appDataSynced` - apps data which is synced between app user's devices
  * `/[appName]`
  * `/system` - for system services and drivers
* `/cacheLocal` - local cache for all the apps and system
  * `/[appName]`
  * `/system` - for system services and drivers
  * `/common` - for anyone
* `/cfgLocal` - local configs for all the apps and system
  * `/[appName]`
  * `/system` - for system services and drivers
  * `/common` - for anyone
* `/cfgSynced` - synced configs for all the apps and system
  * `/[appName]`
  * `/system` - for system services and drivers
  * `/common` - for anyone
* `/db` - all databases of all the apps and system here. They are synced by db engine
  * `/[appName]`
  * `/system` - for system services and drivers
  * `/common` - for anyone
* `/log` - logs for all the apps and system. They are handled by log engine
  * `/[appName]`
  * `/system` - for system services and drivers
  * `/common` - for anyone
* `/tmpLocal` - tmp for all the apps and system. It is local
  * `/[appName]`
  * `/system` - for system services and drivers
  * `/common` - for anyone
* `/home` - common dir where user store his files. They are synced.
  User can select witch files sync between his machines.
  This is the only dir which is accessible outside squidlet.
  * `/.trash` - synced trash bin
  * `/.versions` - synced versions of changed files
  * `/_Apps/[appName]` - synced user data by app e.g. games save files
  * `/_Downloads` - synced dir for downloads
  * `/_Media` - synced images, videos, audio files and documents
  * `/_Mnt` - mount here external dirs or put symlinks (if allowed in config).
  * `/_Tmp` - synced user's tmp dir
    It is machine specific, not synced
  * `...` any other synced user's files

And there is a virtual dir `/external` which is used to have access to local
machine file.

## Start dev

    yarn dev


## Firefox addon

### Install locally

Go to about:debugging#/runtime/this-firefox and click "Load temporary addon".
And select src/starts/FirefoxStarter/addon/manifest.json

### Develop addon

    cd src/starts/FirefoxStarter/addon/
    web-ext run

## Android app


### Dev

* Install OpenJDK Java 11 console and shell (хз - jre11-openjdk)
* Install Android Studio
* Install SDK api 33
* Install SDK build tools - switch to tab "SDK tools", check show details and select build tools 30
* Run virtual phone

    
    cd ./src/starters/AndroidStarter/src
    # run to check an environment
    ns doctor android

    # run
    ns run android
    JAVA_HOME=/usr/lib/jvm/java-11-openjdk ns run android --scan

    ns debug android

## Install development build on Raspberry Pi like board

Prerequisite:

* Install nvm
* Clone repo
* go to project's directory


    sudo apt-get install pigpio
    nvm install
    nvm use
    yarn global add pigpio
    yarn

## Publish

    yarn test
    yarn build
    yarn publish
