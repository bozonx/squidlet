HostsFilesSet = require('../../master/HostsFilesSet').default


describe.only 'master.HostsFilesSet', ->
  beforeEach ->
    @main = {
    }
    @hostsFilesSet = new HostsFilesSet(@main)

  it 'collect', ->
    @hostsFilesSet.collect()

    assert.deepEqual(@hostsFilesSet.getCollection(), {
      master: {
        config: {

        }
        entitiesFiles: {
          devices: {

          }
          drivers: {

          }
          services: {

          }
        }
        systemDrivers: []
        regularDrivers: []
        systemServices: []
        regularServices: []

        devicesDefinitions: []
        driversDefinitions: {

        }
        servicesDefinitions: {

        }
      }
    })
