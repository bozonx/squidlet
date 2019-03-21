path = require('path')

HostsFilesSet = require('../../hostEnvBuilder/configSet/ConfigsSet').default


describe.only 'envBuilder.ConfigsSet', ->
  beforeEach ->

#    @systemDrivers = [ 'SysDriver' ]
#    @systemServices = [ 'SysService' ]
#    @entitySet = {
#      main: './main.ts'
#      files: ['./otherFile']
#      manifest: {manifestParam: 'value'}
#    }
#    @entitySetResult = {
#      main: path.resolve('srcDir', './main.ts')
#      files: [path.resolve('srcDir', './otherFile')]
#      manifest: {manifestParam: 'value'}
#    }
#
#    @main = {
#      configManager: {
#        getHostsIds: => ['master']
#        getHostPlatformDevs: => ['MyDev.dev']
#      }
#      definitions: {
#        getDevicesDefinitions: () => @devicesDefinitions
#        getDriversDefinitions: () => @driversDefinitions
#        getServicesDefinitions: () => @servicesDefinitions
#      }
#      entities: {
#        getDependencies: => @dependencies
#        getSystemDrivers: => @systemDrivers
#        getSystemServices: => @systemServices
#        getDevs: => [ 'Dev' ]
#        getSrcDir: => 'srcDir'
#        getMainFilePath: => @entitySet.main
#        getFiles: => @entitySet.files
#        getManifest: => @entitySet.manifest
#      }
#    }


    @hostConfig = {id: 'myHost'}
    @devicesDefinitions = { device: { id: 'device', className: 'DeviceClass' } }
    @driversDefinitions = {
      SysDriver: { id: 'SysDriver', className: 'SysDriver' }
      RegularDriver: { id: 'RegularDriver', className: 'RegularDriver' }
    }
    @servicesDefinitions = {
      sysService: { id: 'myService', className: 'SysService' }
      regularService: { id: 'myService2', className: 'RegularService' }
    }
    @entitiesNames = {
      devices: ['DeviceClass']
      drivers: ['SysDriver', 'RegularDriver']
      services: ['SysService', 'RegularService']
    }
    @entitiesSet = {
      devices: {}
      drivers: {
        SysDriver: {
          manifest: {
            system: true
          }
        }
        RegularDriver: {
          manifest: {
          }
        }
      }
      services: {
        SysService: {
          manifest: {
            system: true
          }
        }
        RegularService: {
          manifest: {
          }
        }
      }
    }

    @configManager = {
      hostConfig: @hostConfig
    }

    @usedEntities = {
      getEntitiesNames: () => @entitiesNames
      getEntitySet: (type, name) => @entitiesSet[type][name]
    }

    @definitions = {
      getDevicesDefinitions: () => @devicesDefinitions
      getDriversDefinitions: () => @driversDefinitions
      getServicesDefinitions: () => @servicesDefinitions
    }

    @configsSet = new HostsFilesSet(@configManager, @usedEntities, @definitions)


  it 'getConfigSet', ->
    assert.deepEqual @configsSet.getConfigSet(), {
      config: @hostConfig
      systemDrivers: [ 'SysDriver' ]
      regularDrivers: [ 'RegularDriver' ]
      systemServices: [ 'SysService' ]
      regularServices: [ 'RegularService' ]

      devicesDefinitions: Object.values(@devicesDefinitions)
      driversDefinitions: @driversDefinitions
      servicesDefinitions: @servicesDefinitions
    }
#
#  it 'getEntitiesNames', ->
#    assert.deepEqual @configsSet.getEntitiesNames('master'), {
#      devices: [ 'DeviceClass' ]
#      drivers: [ 'SysDriver', 'RegularDriver', 'OtherDriver' ]
#      services: [ 'SysService', 'RegularService' ]
#    }
#
#  it 'generateSrcEntitiesSet', ->
#    assert.deepEqual @configsSet.generateSrcEntitiesSet('master'), {
#      devices: {
#        DeviceClass: {
#          @entitySetResult...
#        }
#      }
#      drivers: {
#        OtherDriver: {
#          @entitySetResult...
#        }
#        RegularDriver: {
#          @entitySetResult...
#        }
#        SysDriver: {
#          @entitySetResult...
#        }
#      }
#      services: {
#        RegularService: {
#          @entitySetResult...
#        }
#        SysService: {
#          @entitySetResult...
#        }
#      }
#    }
#
#  it 'checkPlatformDevDeps - OK situation', ->
#    @main.entities.getDevDependencies = =>
#      {
#        devices: {
#          DeviceClass: [ 'MyDev.dev' ]
#        }
#        drivers: {}
#        services: {}
#      }
#
#    assert.doesNotThrow(() => @configsSet.checkPlatformDevDeps())
#
#  it 'checkPlatformDevDeps - Fail situation', ->
#    @main.entities.getDevDependencies = =>
#      {
#        devices: {
#          DeviceClass: [ 'OtherDev.dev' ]
#        }
#        drivers: {}
#        services: {}
#      }
#
#    assert.throws(
#      () =>
#        @configsSet.checkPlatformDevDeps()
#      'Not registered dev dependencies'
#    )
#
#
#  describe 'recursive dependencies', ->
#    beforeEach ->
#      @devicesDefinitions = {
#        device1: { id: 'device1', className: 'DeviceClass' }
#      }
#      @driversDefinitions = {
#        #Dep1Driver: { id: 'Dep1Driver', className: 'Dep1Driver' }
#      }
#      @dependencies = {
#        devices: {
#          DeviceClass: [ 'Dep1Driver' ]
#        }
#        drivers: {
#          Dep1Driver: [ 'Dep2Driver' ]
#        }
#        services: {}
#      }
#
#      @main = {
#        configManager: {
#          getHostsIds: => ['master']
#          getHostPlatformDevs: => []
#        }
#        definitions: {
#          getDevicesDefinitions: () => @devicesDefinitions
#          getDriversDefinitions: () => @driversDefinitions
#          getServicesDefinitions: () => {}
#        }
#        entities: {
#          getDependencies: => @dependencies
#          getDevs: => []
#        }
#      }
#      @configsSet = new HostsFilesSet(@main)
#
#    it 'getEntitiesNames', ->
#      assert.deepEqual @configsSet.getEntitiesNames('master'), {
#        devices: [ 'DeviceClass' ]
#        drivers: [ 'Dep1Driver', 'Dep2Driver' ]
#        services: []
#      }
