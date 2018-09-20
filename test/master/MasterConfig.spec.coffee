MasterConfig = require('../../configWorks/MasterConfig').default
hostDefaultConfig = require('../../configWorks/configs/hostDefaultConfig').default


describe.only 'master.MasterConfig', ->
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
    pathToMasterConfig = '/masterCfgPath'
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
#      masterConfig: {
#        hostDefaults: {
#          config: {
#            hostDefaultParam: 1
#          }
#        }
#        hosts: {
#          master: @preMasterConfig
#        }
#      }
    }
    @masterConfig = new MasterConfig(@main, @preMasterConfig, @pathToMasterConfig)

  it 'generate', ->
    await @masterConfig.generate()

    #assert.deepEqual(@masterConfig.getHostsIds(), [ 'master' ])
    assert.deepEqual(@masterConfig.getFinalHostConfig('master'), @hostConfigsResult.master)
    assert.deepEqual(@masterConfig.getHostsConfigs(), @hostConfigsResult)
