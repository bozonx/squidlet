path = require('path')

HostsFilesSet = require('../../configWorks/HostsFilesSet').default


describe.only 'master.HostsFilesSet', ->
  beforeEach ->
    @devicesDefinitions = { device: { id: 'device', className: 'DeviceClass' } }
    @driversDefinitions = {
      SysDriver: { id: 'SysDriver', className: 'SysDriver', system: true }
      RegularDriver: { id: 'RegularDriver', className: 'RegularDriver' }
      OtherDriver: { id: 'OtherDriver', className: 'OtherDriver' }
      Dev: { id: 'Dev', className: 'Dev', dev: true }
    }
    @servicesDefinitions = {
      sysService: { id: 'myService', className: 'SysService', system: true }
      regularService: { id: 'myService2', className: 'RegularService' }
    }
    # without devs
    @dependencies = {
      devices: {
        device: [ 'OtherDriver' ]
      }
      drivers: {}
      services: {}
    }
    @systemDrivers = [ 'SysDriver' ]
    @systemServices = [ 'SysService' ]
    @entitySet = {
      main: './main.ts'
      files: ['./otherFile']
      manifest: {manifestParam: 'value'}
    }
    @entitySetResult = {
      main: path.resolve('srcDir', './main.ts')
      files: [path.resolve('srcDir', './otherFile')]
      manifest: {manifestParam: 'value'}
    }

    @main = {
      masterConfig: {
        getHostsIds: => ['master']
        getHostPlatformDevs: => ['MyDev.dev']
      }
      definitions: {
        getHostDevicesDefinitions: () => @devicesDefinitions
        getHostDriversDefinitions: () => @driversDefinitions
        getHostServicesDefinitions: () => @servicesDefinitions
      }
      entities: {
        getDependencies: => @dependencies
        getSystemDrivers: => @systemDrivers
        getSystemServices: => @systemServices
        getDevs: => [ 'Dev' ]
        getSrcDir: => 'srcDir'
        getMainFilePath: => @entitySet.main
        getFiles: => @entitySet.files
        getManifest: => @entitySet.manifest
      }
    }
    @hostsFilesSet = new HostsFilesSet(@main)


  it 'getDefinitionsSet', ->
    assert.deepEqual @hostsFilesSet.getDefinitionsSet('master'), {
      systemDrivers: @systemDrivers
      regularDrivers: [ 'RegularDriver', 'OtherDriver' ]
      systemServices: @systemServices
      regularServices: [ 'RegularService' ]

      devicesDefinitions: Object.values(@devicesDefinitions)
      driversDefinitions: @driversDefinitions
      servicesDefinitions: @servicesDefinitions
    }

  it 'getEntitiesNames', ->
    assert.deepEqual @hostsFilesSet.getEntitiesNames('master'), {
      devices: [ 'DeviceClass' ]
      drivers: [ 'SysDriver', 'RegularDriver', 'OtherDriver' ]
      services: [ 'SysService', 'RegularService' ]
    }

  it 'generateSrcEntitiesSet', ->
    assert.deepEqual @hostsFilesSet.generateSrcEntitiesSet('master'), {
      devices: {
        DeviceClass: {
          @entitySetResult...
        }
      }
      drivers: {
        OtherDriver: {
          @entitySetResult...
        }
        RegularDriver: {
          @entitySetResult...
        }
        SysDriver: {
          @entitySetResult...
        }
      }
      services: {
        RegularService: {
          @entitySetResult...
        }
        SysService: {
          @entitySetResult...
        }
      }
    }

  it 'checkPlatformDevDeps - OK situation', ->
    @main.entities.getDevDependencies = =>
      {
        devices: {
          DeviceClass: [ 'MyDev.dev' ]
        }
        drivers: {}
        services: {}
      }

    assert.doesNotThrow(() => @hostsFilesSet.checkPlatformDevDeps())

  it 'checkPlatformDevDeps - Fail situation', ->
    @main.entities.getDevDependencies = =>
      {
        devices: {
          DeviceClass: [ 'OtherDev.dev' ]
        }
        drivers: {}
        services: {}
      }

    assert.throws(
      () =>
        @hostsFilesSet.checkPlatformDevDeps()
      'Not registered dev dependencies'
    )
