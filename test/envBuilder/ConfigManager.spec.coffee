MasterConfig = require('../../hostEnvBuilder/ConfigManager').default
hostDefaultConfig = require('../../hostEnvBuilder/configs/hostDefaultConfig').default
systemConfig = require('../../hostEnvBuilder/configs/systemConfig').default


describe 'envBuilder.ConfigManager', ->
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
    @configManager = {
      host: @preMasterHostConfig
      hostDefaults: {
        hostDefaultParam: 'value'
      }
    }

    @pathToMasterConfig = '/path/to/configWorks.yaml'

    # TODO: not safe - may be make new class with cloned prototype
    MasterConfig.prototype.getPlatformConfig = => {
      devs: ['Storage']
      hostConfig: { platformParam: 'value' }
    }

    @configManager = new MasterConfig(@configManager, @pathToMasterConfig)


  it 'buildDir on init', ->
    assert.equal(@configManager.buildDir, '/myDir')

  it 'getHostsIds', ->
    assert.deepEqual(@configManager.getHostsIds(), [ 'master' ])

  it 'getPreHostConfig', ->
    assert.deepEqual @configManager.getPreHostConfig('master'), {
      @preMasterHostConfig...
      hostDefaultConfig...
      @configManager.hostDefaults...
      @configManager.getPlatformConfig().hostConfig...
      config: {
        @preMasterHostConfig.config...
        hostDefaultConfig.config...
        @configManager.hostDefaults.config...
        @configManager.getPlatformConfig().hostConfig.config...
      }
    }

  it 'getFinalHostConfig', ->
    assert.deepEqual @configManager.getFinalHostConfig('master'), {
      id: 'master'
      platform: 'rpi'
      config: {
        @preMasterHostConfig.config...
        hostDefaultConfig.config...
        @configManager.hostDefaults.config...
        @configManager.getPlatformConfig().hostConfig.config...
      }
    }

  it 'getHostPlatformDevs', ->
    assert.deepEqual @configManager.getHostPlatformDevs('master'), ['Storage']

  it 'buildDir - use defaults if there is not storage dir of configWorks config', ->
    @configManager.preHosts.master.config.storageDir = undefined

    assert.equal(@configManager.generateBuildDir(@pathToMasterConfig), systemConfig.defaultBuildDir)

  it 'buildDir - use configWorks\'s absolute storageDir', ->
    assert.equal(@configManager.generateBuildDir(@pathToMasterConfig), @preMasterHostConfig.config.storageDir)

  it 'buildDir - use configWorks\'s relative storageDir', ->
    @configManager.preHosts.master.config.storageDir = './myDir'

    assert.equal(@configManager.generateBuildDir(@pathToMasterConfig), '/path/to/myDir')
