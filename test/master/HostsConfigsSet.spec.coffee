HostsConfigsSet = require('../../master/HostsConfigsSet').default
hostDefaultConfig = require('../../master/configs/hostDefaultConfig').default


describe 'master.HostsConfigsSet', ->
  beforeEach ->
    @preMasterConfig = {
      platform: 'rpi'
      config: {
        storageDir: '/myDir'
      }
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
    @hostConfigsResult = {
      master: {
        @preMasterConfig...
        config: {
          hostDefaultConfig.config...
          @preMasterConfig.config...
          hostDefaultParam: 1
        }
      }
    }

    @main = {
      masterConfig: {
        hostDefaults: {
          config: {
            hostDefaultParam: 1
          }
        }
        hosts: {
          master: @preMasterConfig
        }
      }
    }
    @hostsConfigsSet = new HostsConfigsSet(@main)

  it 'generate', ->
    await @hostsConfigsSet.generate()

    assert.deepEqual(@hostsConfigsSet.getHostsIds(), [ 'master' ])
    assert.deepEqual(@hostsConfigsSet.getHostConfig('master'), @hostConfigsResult.master)
    assert.deepEqual(@hostsConfigsSet.getHostsConfigs(), @hostConfigsResult)
