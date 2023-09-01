# Squidlet

Easy make IoT devices and local net of devices which can be managed by master

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
