normalize = require('../../hostEnvBuilder/hostConfig/normalizeHostConfig').default


describe 'envBuilder.normalizeHostConfig', ->
  it 'devices, drviers and services', ->
    hostConfig = {
      devices: {
        room: {
          myDevice: {
            device: 'DeviceClass'
            param: 1
          }
        }
      }
      drivers: {
        MyDriver: {
          param: 1
        }
      }
      services: {
        myService: {
          service: 'ServiceClass'
          param: 1
        }
      }
    }

    assert.deepEqual(normalize(hostConfig), {
      devices: {
        'room.myDevice': {
          className: 'DeviceClass'
          param: 1
        }
      }
      drivers: {
        MyDriver: {
          className: 'MyDriver'
          param: 1
        }
      }
      services: {
        # default service
#        consoleLogger: {
#          className: 'ConsoleLogger'
#        }
        myService: {
          className: 'ServiceClass'
          param: 1
        }
      }
    })

  it 'services shortcuts', ->
    hostConfig = {
      devices: {}
      drivers: {}
      services: {
        myService: {
          service: 'ServiceClass'
          param: 1
        }
      }

      automation: {
        param: 1
      }
      mqtt: {
        param: 2
      }
#      consoleLogger: {
#        param: 3
#      }
    }

    assert.deepEqual(normalize(hostConfig), {
      devices: {}
      drivers: {}
      services: {
        myService: {
          className: 'ServiceClass'
          param: 1
        }
        automation: {
          className: 'Automation'
          param: 1
        }
        mqtt: {
          className: 'Mqtt'
          param: 2
        }
      }
    })
