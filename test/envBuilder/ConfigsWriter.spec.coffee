path = require('path')

HostsConfigsWriter = require('../../hostEnvBuilder/configSet/ConfigsWriter').default


describe.only 'envBuilder.ConfigsWriter', ->
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
      configManager: {
        buildDir: '/buildDir'
        getHostsIds: => [ 'master' ]
        getFinalHostConfig: => 'config'
      }
      configsSet: {
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




    @hostConfigSet = {
      config: 'config'
      systemDrivers: 'systemDrivers'
      regularDrivers: 'regularDrivers'
      systemServices: 'systemServices'
      regularServices: 'regularServices'
      devicesDefinitions: 'devicesDefinitions'
      driversDefinitions: 'driversDefinitions'
      servicesDefinitions: 'servicesDefinitions'
    }

    @io = {
      writeJson: sinon.spy()
    }

    @configManager = {
      buildDir: '/path/to/buildDir'
    }

    @configsSet = {
      getConfigSet: () => @hostConfigSet
    }

    @configsWriter = new HostsConfigsWriter(@io, @configManager, @configsSet)

    #@configsWriter.writeJson = sinon.spy()


  it 'write', ->
    await @configsWriter.write()

    sinon.assert.calledWith(@io.writeJson.getCall(0),
      "#{@configManager.buildDir}/configs/config.json",
      @hostConfigSet.config
    )
    sinon.assert.calledWith(@io.writeJson.getCall(1),
      "#{@configManager.buildDir}/configs/systemDrivers.json",
      @hostConfigSet.systemDrivers
    )
    sinon.assert.calledWith(@io.writeJson.getCall(2),
      "#{@configManager.buildDir}/configs/regularDrivers.json",
      @hostConfigSet.regularDrivers
    )
    sinon.assert.calledWith(@io.writeJson.getCall(3),
      "#{@configManager.buildDir}/configs/systemServices.json",
      @hostConfigSet.systemServices
    )
    sinon.assert.calledWith(@io.writeJson.getCall(4),
      "#{@configManager.buildDir}/configs/regularServices.json",
      @hostConfigSet.regularServices
    )
    sinon.assert.calledWith(@io.writeJson.getCall(5),
      "#{@configManager.buildDir}/configs/devicesDefinitions.json",
      @hostConfigSet.devicesDefinitions
    )
    sinon.assert.calledWith(@io.writeJson.getCall(6),
      "#{@configManager.buildDir}/configs/driversDefinitions.json",
      @hostConfigSet.driversDefinitions
    )
    sinon.assert.calledWith(@io.writeJson.getCall(7),
      "#{@configManager.buildDir}/configs/servicesDefinitions.json",
      @hostConfigSet.servicesDefinitions
    )
#    sinon.assert.calledWith(@io.writeJson.getCall(8),
#      "/buildDir/hosts/configWorks/usedEntities.json",
#      @entitiesNames
#    )


#  it 'writeEntitiesFiles', ->
#    await @configsWriter.writeEntitiesFiles()
#
#    sinon.assert.calledOnce(@configsWriter.writeJson)
#    sinon.assert.calledOnce(@main.io.mkdirP)
#    sinon.assert.calledOnce(@main.io.copyFile)
#
#    sinon.assert.calledWith(@configsWriter.writeJson,
#      '/buildDir/entities/devices/device1/manifest.json',
#      {manifestParam: 'value'}
#    )
#    sinon.assert.calledWith(@main.io.mkdirP, '/buildDir/entities/devices/device1')
#    sinon.assert.calledWith(@main.io.copyFile,
#      path.resolve('srcDir', 'someFile'),
#      '/buildDir/entities/devices/device1/someFile'
#    )
