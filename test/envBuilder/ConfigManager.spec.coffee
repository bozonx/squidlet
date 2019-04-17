ConfigManager = require('../../hostEnvBuilder/hostConfig/ConfigManager').default


describe 'envBuilder.ConfigManager', ->
  beforeEach ->
    @io = {}
    @preHostConfig = {
      id: 'myHost'
      platform: 'nodejs'
      machine: 'rpi'
      config: {
        hostParam: 1
      },
      devicesDefaults: {
        defaultParam: 1
      }
      devices: {
        myDevice: {
          device: 'Switch'
        }
      }
      devs: {
        MyDev: { topParam: 1 }
      }
    }
    @machineConfig = {
      devs: ['./Storage.ts']
      devsSupportFiles: [
        './package.json'
      ]
      hostConfig: {
        config: {
          #envSetDir: '/path/to/env'
          platformParam: 1
        },
        devs: {
          MyDev: { topParam: 2, bottomParam: 2 }
        }
      }
    }
    @buildDir = '/buildDir'
    @tmpDir = '/tmpDir'

  it 'init', ->
    @configManager = new ConfigManager(@io, @preHostConfig, @buildDir, @tmpDir)
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
      drivers: {}
      services: {
        # default service
        logger: {
          className: 'Logger'
        }
      }
    })
    assert.deepEqual(@configManager.devsDefinitions, {
      MyDev: { topParam: 1, bottomParam: 2 }
    })
    assert.deepEqual(@configManager.machineConfig, @machineConfig)
    assert.deepEqual(@configManager.devicesDefaults, @preHostConfig.devicesDefaults)
    assert.deepEqual(@configManager.hostConfig, {
      config: {
        defaultConfigRepublishIntervalMs: 600000
        defaultStatusRepublishIntervalMs: 60000
        logLevel: 'info'
        senderResendTimeout: 1
        senderTimeout: 60

        #envSetDir: @machineConfig.hostConfig.config.envSetDir
        platformParam: 1
        hostParam: 1
      }
      id: 'myHost'
      machine: 'rpi'
      platform: 'nodejs'
    })

  it 'use buildDir from config', ->
    @configManager = new ConfigManager(@io, @preHostConfig)
    @configManager.loadMachineConfig = () => @machineConfig

    await @configManager.init()

    # TODO: review envSetDir

    assert.equal(@configManager.buildDir, @machineConfig.hostConfig.config.envSetDir)
