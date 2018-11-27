path = require('path')

HostsFilesWriter = require('../../configWorks/HostsFilesWriter').default


describe 'configWorks.HostsFilesWriter', ->
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
        getHostsIds: => [ 'master' ]
        getFinalHostConfig: => 'config'
      }
      hostsFilesSet: {
        getDefinitionsSet: => @definitionsSet
        getEntitiesNames: => @entitiesNames
      }
      entities: {
        getAllEntitiesNames: =>
          {
            devices: [ 'device1' ]
          }
        getSrcDir: => 'srcDir'
        getManifest: => {manifestParam: 'value'}
        getFiles: => ['./someFile']
      }
      io: {
        mkdirP: sinon.spy()
        copyFile: sinon.spy()
      }
    }
    @hostsFilesWriter = new HostsFilesWriter(@main)

    @hostsFilesWriter.writeJson = sinon.spy()

  it 'writeEntitiesFiles', ->
    await @hostsFilesWriter.writeEntitiesFiles()

    sinon.assert.calledOnce(@hostsFilesWriter.writeJson)
    sinon.assert.calledOnce(@main.io.mkdirP)
    sinon.assert.calledOnce(@main.io.copyFile)

    sinon.assert.calledWith(@hostsFilesWriter.writeJson,
      '/buildDir/entities/devices/device1/manifest.json',
      {manifestParam: 'value'}
    )
    sinon.assert.calledWith(@main.io.mkdirP, '/buildDir/entities/devices/device1')
    sinon.assert.calledWith(@main.io.copyFile,
      path.resolve('srcDir', 'someFile'),
      '/buildDir/entities/devices/device1/someFile'
    )

  it 'writeHostsFiles', ->
    configDir = '/buildDir/hosts/configWorks/config'

    await @hostsFilesWriter.writeHostsFiles()

    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(0),
      "#{configDir}/hostConfig.json",
      'config'
    )

    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(1),
      "#{configDir}/systemDrivers.json",
      @definitionsSet.systemDrivers
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(2),
      "#{configDir}/regularDrivers.json",
      @definitionsSet.regularDrivers
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(3),
      "#{configDir}/systemServices.json",
      @definitionsSet.systemServices
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(4),
      "#{configDir}/regularServices.json",
      @definitionsSet.regularServices
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(5),
      "#{configDir}/devicesDefinitions.json",
      @definitionsSet.devicesDefinitions
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(6),
      "#{configDir}/driversDefinitions.json",
      @definitionsSet.driversDefinitions
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(7),
      "#{configDir}/servicesDefinitions.json",
      @definitionsSet.servicesDefinitions
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(8),
      "/buildDir/hosts/configWorks/usedEntities.json",
      @entitiesNames
    )
