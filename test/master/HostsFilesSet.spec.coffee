HostsFilesSet = require('../../master/HostsFilesSet').default


describe.only 'master.HostsFilesSet', ->
  beforeEach ->
    @hostConfig = { host: 'config' }
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
    @entitiesFiles = {
      devices: {
        DeviceClass: [ '/path/to/file' ]
      }
      drivers: {
        SysDriver: [ '/path/to/file' ]
        RegularDriver: [ '/path/to/file' ]
        OtherDriver: [ '/path/to/file' ]
        Dev: [ '/path/to/file' ]
      }
      services: {
        SysService: [ '/path/to/file' ]
        RegularService: [ '/path/to/file' ]
      }
    }

    @main = {
      hostsConfigSet: {
        getHostsIds: => [ 'master' ]
        getHostConfig: => @hostConfig
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
        getFiles: => @entitiesFiles
        getDevs: => [ 'Dev' ]
      }
    }
    @hostsFilesSet = new HostsFilesSet(@main)

  it 'collect', ->
    @hostsFilesSet.collect()

    assert.deepEqual(@hostsFilesSet.getCollection(), {
      master: {
        config: @hostConfig
        entitiesFiles: {
          @entitiesFiles...
          drivers: _.omit(@entitiesFiles.drivers, 'Dev')
        }

        systemDrivers: @systemDrivers
        regularDrivers: [ 'RegularDriver', 'OtherDriver' ]
        systemServices: @systemServices
        regularServices: [ 'RegularService' ]

        devicesDefinitions: Object.values(@devicesDefinitions)
        driversDefinitions: @driversDefinitions
        servicesDefinitions: @servicesDefinitions
      }
    })
