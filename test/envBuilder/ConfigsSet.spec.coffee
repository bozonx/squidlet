path = require('path')

HostsFilesSet = require('../../hostEnvBuilder/configSet/ConfigsSet').default


describe 'envBuilder.ConfigsSet', ->
  beforeEach ->
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
