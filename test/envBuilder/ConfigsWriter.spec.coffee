path = require('path')

ConfigsWriter = require('../../hostEnvBuilder/configSet/ConfigsWriter').default


describe 'envBuilder.ConfigsWriter', ->
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
      devsDefinitions: 'devsDefinitions'
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

    @configsWriter = new ConfigsWriter(@io, @configManager, @configsSet)


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
    sinon.assert.calledWith(@io.writeJson.getCall(8),
      "#{@configManager.buildDir}/configs/devsDefinitions.json",
      @hostConfigSet.devsDefinitions
    )
#    sinon.assert.calledWith(@io.writeJson.getCall(8),
#      "/buildDir/hosts/configWorks/usedEntities.json",
#      @entitiesNames
#    )
