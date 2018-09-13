HostsFilesSet = require('../../configWorks/HostsFilesSet').default


describe 'master.HostsFilesSet', ->
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

    @main = {
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
