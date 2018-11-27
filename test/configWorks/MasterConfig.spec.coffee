MasterConfig = require('../../configWorks/MasterConfig').default
hostDefaultConfig = require('../../configWorks/configs/hostDefaultConfig').default
systemConfig = require('../../configWorks/configs/systemConfig').default


describe 'configWorks.MasterConfig', ->
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

    @pathToMasterConfig = '/path/to/configWorks.yaml'

    # TODO: not safe - may be make new class with cloned prototype
    MasterConfig.prototype.getPlatformConfig = => {
      devs: ['Fs']
      hostConfig: { platformParam: 'value' }
    }

    @masterConfig = new MasterConfig(@masterConfig, @pathToMasterConfig)


  it 'buildDir on init', ->
    assert.equal(@masterConfig.buildDir, '/myDir')

  it 'getHostsIds', ->
    assert.deepEqual(@masterConfig.getHostsIds(), [ 'master' ])

  it 'getPreHostConfig', ->
    assert.deepEqual @masterConfig.getPreHostConfig('master'), {
      @preMasterHostConfig...
      hostDefaultConfig...
      @masterConfig.hostDefaults...
      @masterConfig.getPlatformConfig().hostConfig...
      config: {
        @preMasterHostConfig.config...
        hostDefaultConfig.config...
        @masterConfig.hostDefaults.config...
        @masterConfig.getPlatformConfig().hostConfig.config...
      }
    }

  it 'getFinalHostConfig', ->
    assert.deepEqual @masterConfig.getFinalHostConfig('master'), {
      id: 'master'
      platform: 'rpi'
      config: {
        @preMasterHostConfig.config...
        hostDefaultConfig.config...
        @masterConfig.hostDefaults.config...
        @masterConfig.getPlatformConfig().hostConfig.config...
      }
    }

  it 'getHostPlatformDevs', ->
    assert.deepEqual @masterConfig.getHostPlatformDevs('master'), ['Fs']

  it 'buildDir - use defaults if there is not storage dir of configWorks config', ->
    @masterConfig.preHosts.master.config.storageDir = undefined

    assert.equal(@masterConfig.generateBuildDir(@pathToMasterConfig), systemConfig.defaultDuildDir)

  it 'buildDir - use configWorks\'s absolute storageDir', ->
    assert.equal(@masterConfig.generateBuildDir(@pathToMasterConfig), @preMasterHostConfig.config.storageDir)

  it 'buildDir - use configWorks\'s relative storageDir', ->
    @masterConfig.preHosts.master.config.storageDir = './myDir'

    assert.equal(@masterConfig.generateBuildDir(@pathToMasterConfig), '/path/to/myDir')
