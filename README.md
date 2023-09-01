# Squidlet

Easy make IoT devices and local net of devices which can be managed by master

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

## Firefox addon

### Install locally

Go to about:debugging#/runtime/this-firefox and click "Load temporary addon".
And select src/starts/FirefoxStarter/addon/manifest.json

### Develop addon

    cd src/starts/FirefoxStarter/addon/
    web-ext run

## Android app


### Dev

* Install Android Studio
* Install SDK api 30
* Install SDK build tools - switch to tab "SDK tools", check show details and select build tools 30
* Run virtual phone

    
    # run to check an environment
    ns doctor android

    # run
    ns run android