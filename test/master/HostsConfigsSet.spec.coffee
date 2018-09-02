HostsConfigsSet = require('../../master/HostsConfigsSet').default
hostDefaultConfig = require('../../master/configs/hostDefaultConfig').default


describe.only 'master.HostsConfigsSet', ->
  beforeEach ->
    @hostConfigsResult = {
      master: {
        host: {
          hostDefaultConfig...
          storageDir: '/myDir'
          hostDefaultParam: 1
        }
      }
    }
    @main = {
      masterConfig: {
        hostDefaults: {
          hostDefaultParam: 1
        }
      }
      masterConfigHosts: {
        master: {
          platform: 'rpi'
          devices: {
            room1: {
              relay: {
                device: 'Relay'
                pin: 1
              }
            }
          }
          drivers: {
            'Gpio.driver': {
              param: 1
            }
          }
          services: {
            backend: {
              service: 'Backend'
              param: 1
            }
          }
          devicesDefaults: {
            Relay: {
              baseOne: true
            }
          }
        }
      }
    }
    @hostsConfigsSet = new HostsConfigsSet(@main)

  it 'generate', ->
    @hostsConfigsSet.checkDefinitions = sinon.spy()

    await @hostsConfigsSet.generate()

    assert.deepEqual(@hostsConfigsSet.getHostsIds(), [ 'master' ])
    assert.deepEqual(@hostsConfigsSet.getHostConfig('master'), @hostConfigsResult.master)
    assert.deepEqual(@hostsConfigsSet.getHostsConfigs(), @hostConfigsResult)
    assert.deepEqual(@hostsConfigsSet.getHostDevicesDefinitions(), {
      'room1.relay': {
        id: 'room1.relay'
        className: 'Relay'
        pin: 1
        baseOne: true
      }
    })
    assert.deepEqual(@hostsConfigsSet.getHostDriversDefinitions(), {
      'Gpio.driver': {
        id: 'Gpio.driver'
        className: 'Gpio.driver'
        param: 1
      }
    })
    assert.deepEqual(@hostsConfigsSet.getHostServicesDefinitions(), {
      backend: {
        id: 'backend'
        className: 'Backend'
        param: 1
      }
    })

    sinon.assert.calledOnce(@hostsConfigsSet.checkDefinitions)

  # TODO: test checkDefinitions
