HostsFilesSet = require('../../master/HostsFilesSet').default


describe.only 'master.HostsFilesSet', ->
  beforeEach ->
    @hostConfig = { host: 'config' }
    @devicesDefinitions = { device: { id: 'device', className: 'DeviceClass' } }
    @driversDefinitions = {
      'SysDriver': { id: 'SysDriver', className: 'SysDriver', system: true }
      'RegularDriver': { id: 'RegularDriver', className: 'RegularDriver' }
      # TODO: !!!!!
      #'Dev': { id: 'Dev': className: 'Dev', dev: true }
    }
    @servicesDefinitions = {
      'SysService': { id: 'myService', className: 'SysService', system: true }
      'RegularService': { id: 'myService2', className: 'RegularService' }
    }
    # TODO: !!!!!
    @dependencies = {
      devices: {

      }
      drivers: {

      }
      services: {

      }
    }
    @systemDrivers = [ 'SysDriver' ]
    @systemServices = [ 'SysService' ]


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
      }
    }
    @hostsFilesSet = new HostsFilesSet(@main)

  it 'collect', ->
    @hostsFilesSet.collect()

    assert.deepEqual(@hostsFilesSet.getCollection(), {
      master: {
        config: @hostConfig
        # TODO: !!!!!
        entitiesFiles: {
          devices: {

          }
          drivers: {

          }
          services: {

          }
        }
        systemDrivers: @systemDrivers
        regularDrivers: [ 'RegularDriver' ]
        systemServices: @systemServices
        regularServices: [ 'RegularService' ]

        devicesDefinitions: Object.values(@devicesDefinitions)
        driversDefinitions: @driversDefinitions
        servicesDefinitions: @servicesDefinitions
      }
    })
