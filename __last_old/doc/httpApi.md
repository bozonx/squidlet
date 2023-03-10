# Http api

All the methods use GET http method for better use. Template of requests lite this:

    GET http://myServer:8087/api/methodName/param1,5
    
Default port is `8087`

## Get host info

    /api/info

## Call device action

    /api/action/<room.deviceId>,<actionName>,<value>

## Get device status

    /api/getDeviceStatus/<room.deviceId>

## Get device config

    /api/getDeviceConfig/<room.deviceId>

## Get any state

Categories:
* 0 - device state
* 1 - device config


    /api/getState/<categoryNumber>,<room.deviceId>

## Republish all the states

    /api/republishWholeState
    
## Switch app to IO server

    /api/switchApp
    
## Switch IO server to app

    /api/switchToApp

## Reboot host

    /api/reboot
