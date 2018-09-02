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
    await @hostsConfigsSet.generate()

    assert.deepEqual(@hostsConfigsSet.getHostsIds(), [ 'master' ])
    assert.deepEqual(@hostsConfigsSet.getHostConfig('master'), @hostConfigsResult.master)
    assert.deepEqual(@hostsConfigsSet.getHostsConfigs(), @hostConfigsResult)
