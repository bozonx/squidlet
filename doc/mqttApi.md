# MQTT api

## Structure of request

* Prefix is optional
* Type of request is mandatory: `api` or `action`

### Call api method

Topic `[prefix/]api/methodName` data `param1,param2`
or deeper into namespace `[prefix/]api/namespace.methodName`

### Special api for working with devices' actions, status and config
Call action
    
Topic `[prefix/]action/roomName.deviceName/actionName` data `param1,param2`
    
Subscribe to device status
Default status:

    [prefix/]status/roomName.deviceName

Specified status:

    [prefix/]status/roomName.deviceName/statusName

Config

    [prefix/]config/roomName.deviceName


## Arguments of api methods and actions

