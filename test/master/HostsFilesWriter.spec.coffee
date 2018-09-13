HostsFilesWriter = require('../../configWorks/HostsFilesWriter').default


describe.only 'master.HostsFilesWriter', ->
  beforeEach ->
    @definitionsSet = {
      systemDrivers: 'systemDrivers'
      regularDrivers: 'regularDrivers'
      systemServices: 'systemServices'
      regularServices: 'regularServices'
      devicesDefinitions: 'devicesDefinitions'
      driversDefinitions: 'driversDefinitions'
      servicesDefinitions: 'servicesDefinitions'
      entitiesFiles: 'entitiesFiles'
    }
    @entitiesNames = {
      devices: [ 'device1' ]
      drivers: [ 'Driver1' ]
      services: [ 'service1' ]
    }
    @main = {
      masterConfig: {
        buildDir: '/buildDir'
      }
      hostsConfigSet: {
        getHostsIds: => [ 'master' ]
        getHostConfig: => 'config'
      }
      hostsFilesSet: {
        getDefinitionsSet: => @definitionsSet
        getEntitiesNames: => @entitiesNames
      }
      $writeJson: sinon.spy()
    }
    @hostsFilesWriter = new HostsFilesWriter(@main)

  it 'writeEntitiesFiles', ->
    # TODO: !!!!

  it 'writeHostsFiles', ->
    configDir = '/buildDir/hosts/master/config'

    await @hostsFilesWriter.writeHostsFiles()

    sinon.assert.calledWith(@main.$writeJson.getCall(0),
      "#{configDir}/hostConfig.json",
      'config'
    )

    sinon.assert.calledWith(@main.$writeJson.getCall(1),
      "#{configDir}/systemDrivers.json",
      @definitionsSet.systemDrivers
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(2),
      "#{configDir}/regularDrivers.json",
      @definitionsSet.regularDrivers
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(3),
      "#{configDir}/systemServices.json",
      @definitionsSet.systemServices
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(4),
      "#{configDir}/regularServices.json",
      @definitionsSet.regularServices
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(5),
      "#{configDir}/devicesDefinitions.json",
      @definitionsSet.devicesDefinitions
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(6),
      "#{configDir}/driversDefinitions.json",
      @definitionsSet.driversDefinitions
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(7),
      "#{configDir}/servicesDefinitions.json",
      @definitionsSet.servicesDefinitions
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(8),
      "/buildDir/hosts/master/usedEntities.json",
      @entitiesNames
    )
