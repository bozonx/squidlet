MasterConfig = require('../../configWorks/MasterConfig').default
hostDefaultConfig = require('../../configWorks/configs/hostDefaultConfig').default


describe.only 'master.MasterConfig', ->
  beforeEach ->
    @preMasterHostConfig = {
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
    @masterConfig = {
      host: @preMasterHostConfig
      hostDefaults: {
        hostDefaultParam: 'value'
      }
    }

    @pathToMasterConfig = '/masterCfgPath'

#    @hostConfigsResult = {
#      master: {
#        @preMasterConfig...
#        config: {
#          hostDefaultConfig.config...
#          @preMasterConfig.config...
#          hostDefaultParam: 1
#        }
#      }
#    }

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

    # TODO: not safe - may be make new class with cloned prototype
    MasterConfig.prototype.getPlatformConfig = => { hostConfig: { platformParam: 'value' } }

    @masterConfig = new MasterConfig(@main, @masterConfig, @pathToMasterConfig)


  it 'buildDir', ->
    # TODO: !!!!

  it 'getHostsIds', ->
    assert.deepEqual(@masterConfig.getHostsIds(), [ 'master' ])

  it 'getPreHostConfig', ->
    assert.deepEqual @masterConfig.getPreHostConfig('master'), {
      @preMasterHostConfig...
      hostDefaultConfig...
      config: {
        @preMasterHostConfig.config...
        hostDefaultConfig.config...
      }
      hostDefaultParam: 'value'
      platformParam: 'value'
    }

  it 'getFinalHostConfig', ->
    # TODO: !!!!

  it 'getHostPlatformDevs', ->
    # TODO: !!!!

  it 'generatePreHosts', ->
    # TODO: !!!!

    #await @masterConfig.generate()

    #assert.deepEqual(@masterConfig.getHostsIds(), [ 'master' ])
#    assert.deepEqual(@masterConfig.getFinalHostConfig('master'), @hostConfigsResult.master)
#    assert.deepEqual(@masterConfig.getHostsConfigs(), @hostConfigsResult)
