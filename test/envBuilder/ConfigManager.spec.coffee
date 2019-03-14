ConfigManager = require('../../hostEnvBuilder/ConfigManager').default
hostDefaultConfig = require('../../hostEnvBuilder/configs/hostDefaultConfig').default
systemConfig = require('../../hostEnvBuilder/configs/systemConfig').default


describe.only 'envBuilder.ConfigManager', ->
  beforeEach ->
    @io = {}
    @preHostConfig = {
      id: 'myHost'
      platform: 'nodejs'
      machine: 'rpi'
      config: {
        hostParam: 1
      },
      devices: {
        myDevice: {
          device: 'Switch'
        }
      }
    }
    @machineConfig = {
      devs: ['Storage']
      hostConfig: {
        defaultVarDataDir: '~/.squidlet/data',
        defaultEnvSetDir: '~/.squidlet/envSet',
        config: {
          platformParam: 1
        },
      }
    }
    @buildDir = '/buildDir'
    @tmpDir = '/tmpDir'

    @configManager = new ConfigManager(@io, @preHostConfig, @buildDir, @tmpDir)

  it 'init', ->
    @configManager.loadMachineConfig = () => @machineConfig

    await @configManager.init()

    assert.equal(@configManager.buildDir, @buildDir)
    assert.equal(@configManager.tmpBuildDir, @tmpDir)
    assert.deepEqual(@configManager.preEntities, {
      devices: {
        myDevice: {
          className: 'Switch'
        }
      }
    })
    assert.deepEqual(@configManager.machineConfig, @machineConfig)
    assert.deepEqual(@configManager.devicesDefaults, {})
#    assert.deepEqual(@configManager.hostConfig, {
#
#    })



#  it 'buildDir on init', ->
#    assert.equal(@configManager.buildDir, '/myDir')
#
#  it 'getHostsIds', ->
#    assert.deepEqual(@configManager.getHostsIds(), [ 'master' ])
#
#  it 'getPreHostConfig', ->
#    assert.deepEqual @configManager.getPreHostConfig('master'), {
#      @preMasterHostConfig...
#      hostDefaultConfig...
#      @configManager.hostDefaults...
#      @configManager.getPlatformConfig().hostConfig...
#      config: {
#        @preMasterHostConfig.config...
#        hostDefaultConfig.config...
#        @configManager.hostDefaults.config...
#        @configManager.getPlatformConfig().hostConfig.config...
#      }
#    }
#
#  it 'getFinalHostConfig', ->
#    assert.deepEqual @configManager.getFinalHostConfig('master'), {
#      id: 'master'
#      platform: 'rpi'
#      config: {
#        @preMasterHostConfig.config...
#        hostDefaultConfig.config...
#        @configManager.hostDefaults.config...
#        @configManager.getPlatformConfig().hostConfig.config...
#      }
#    }
#
#  it 'getHostPlatformDevs', ->
#    assert.deepEqual @configManager.getHostPlatformDevs('master'), ['Storage']
#
#  it 'buildDir - use defaults if there is not storage dir of configWorks config', ->
#    @configManager.preHosts.master.config.storageDir = undefined
#
#    assert.equal(@configManager.generateBuildDir(@pathToMasterConfig), systemConfig.defaultBuildDir)
#
#  it 'buildDir - use configWorks\'s absolute storageDir', ->
#    assert.equal(@configManager.generateBuildDir(@pathToMasterConfig), @preMasterHostConfig.config.storageDir)
#
#  it 'buildDir - use configWorks\'s relative storageDir', ->
#    @configManager.preHosts.master.config.storageDir = './myDir'
#
#    assert.equal(@configManager.generateBuildDir(@pathToMasterConfig), '/path/to/myDir')
