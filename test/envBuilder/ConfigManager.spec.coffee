ConfigManager = require('../../hostEnvBuilder/hostConfig/ConfigManager').default


describe 'envBuilder.ConfigManager', ->
  beforeEach ->
    @os = {}
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
      ios: {
        MyDev: { topParam: 1 }
      }
    }
    @machineConfig = {
      ios: ['./Storage.ts']
#      iosSupportFiles: [
#        './helper.js'
#      ]
      hostConfig: {
        config: {
          platformParam: 1
        },
        ios: {
          MyDev: { topParam: 2, bottomParam: 2 }
        }
      }
    }

  it 'init', ->
    @configManager = new ConfigManager(@os, @preHostConfig)
    @configManager.loadMachineConfig = () => @machineConfig

    await @configManager.init()

    assert.deepEqual(@configManager.preEntities, {
      devices: {
        myDevice: {
          className: 'Switch'
        }
      }
      drivers: {}
      services: {
        # default service
#        consoleLogger: {
#          className: 'ConsoleLogger'
#        }
      }
    })
    assert.deepEqual(@configManager.iosDefinitions, {
      MyDev: { topParam: 1, bottomParam: 2 }
    })
    assert.deepEqual(@configManager.machineConfig, @machineConfig)
    assert.deepEqual(@configManager.devicesDefaults, @preHostConfig.devicesDefaults)
    assert.deepEqual(@configManager.hostConfig, {
      config: {
        #defaultConfigRepublishIntervalMs: 600000
        #defaultStatusRepublishIntervalMs: 60000
        senderResendTimeout: 1
        requestTimeoutSec: 60
        rcResponseTimoutSec: 30

        platformParam: 1
        hostParam: 1
      }
      id: 'myHost'
      machine: 'rpi'
      platform: 'nodejs'
    })
