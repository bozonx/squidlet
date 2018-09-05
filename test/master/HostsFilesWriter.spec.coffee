HostsFilesWriter = require('../../master/HostsFilesWriter').default


describe 'master.HostsFilesWriter', ->
  beforeEach ->
    @hostFiles = {
      master: {
        config: 'config'
        systemDrivers: 'systemDrivers'
        regularDrivers: 'regularDrivers'
        systemServices: 'systemServices'
        regularServices: 'regularServices'
        devicesDefinitions: 'devicesDefinitions'
        driversDefinitions: 'driversDefinitions'
        servicesDefinitions: 'servicesDefinitions'
        entitiesFiles: 'entitiesFiles'
      }
    }
    @main = {
      masterConfig: {
        buildDir: '/bildDir'
      }
      hostsFilesSet: {
        getCollection: => @hostFiles
      }
      $writeJson: sinon.spy()
    }
    @hostsFilesWriter = new HostsFilesWriter(@main)

  it 'writeToStorage', ->
    configDir = '/bildDir/hosts/master/config'

    await @hostsFilesWriter.writeToStorage()

    sinon.assert.calledWith(@main.$writeJson.getCall(0),
      "#{configDir}/hostConfig.json",
      @hostFiles.master.config
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(1),
      "#{configDir}/systemDrivers.json",
      @hostFiles.master.systemDrivers
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(2),
      "#{configDir}/regularDrivers.json",
      @hostFiles.master.regularDrivers
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(3),
      "#{configDir}/systemServices.json",
      @hostFiles.master.systemServices
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(4),
      "#{configDir}/regularServices.json",
      @hostFiles.master.regularServices
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(5),
      "#{configDir}/devicesDefinitions.json",
      @hostFiles.master.devicesDefinitions
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(6),
      "#{configDir}/driversDefinitions.json",
      @hostFiles.master.driversDefinitions
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(7),
      "#{configDir}/servicesDefinitions.json",
      @hostFiles.master.servicesDefinitions
    )
    sinon.assert.calledWith(@main.$writeJson.getCall(8),
      "/bildDir/hosts/master/entitiesFiles.json",
      @hostFiles.master.entitiesFiles
    )
