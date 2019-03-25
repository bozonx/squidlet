path = require('path')

EntitiesWriter = require('../../hostEnvBuilder/entities/EntitiesWriter').default


describe.only 'envBuilder.EntitiesWriter', ->
  beforeEach ->

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

    @entitiesWriter = new EntitiesWriter(@io, @configManager, @configsSet)


  it 'write', ->
    await @entitiesWriter.write()

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
#    await @entitiesWriter.writeEntitiesFiles()
#
#    sinon.assert.calledOnce(@entitiesWriter.writeJson)
#    sinon.assert.calledOnce(@main.io.mkdirP)
#    sinon.assert.calledOnce(@main.io.copyFile)
#
#    sinon.assert.calledWith(@entitiesWriter.writeJson,
#      '/buildDir/entities/devices/device1/manifest.json',
#      {manifestParam: 'value'}
#    )
#    sinon.assert.calledWith(@main.io.mkdirP, '/buildDir/entities/devices/device1')
#    sinon.assert.calledWith(@main.io.copyFile,
#      path.resolve('srcDir', 'someFile'),
#      '/buildDir/entities/devices/device1/someFile'
#    )
