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
      iosDefinitions: 'iosDefinitions'
    }

    @io = {
      writeJson: sinon.spy()
    }

    @buildDir = '/path/to/buildDir'

    @configsSet = {
      getConfigSet: () => @hostConfigSet
    }

    @configsWriter = new ConfigsWriter(@io, @configsSet, @buildDir)


  it 'write', ->
    await @configsWriter.write()

    sinon.assert.calledWith(@io.writeJson.getCall(0),
      "#{@buildDir}/configs/config.json",
      @hostConfigSet.config
    )
    sinon.assert.calledWith(@io.writeJson.getCall(1),
      "#{@buildDir}/configs/systemDrivers.json",
      @hostConfigSet.systemDrivers
    )
    sinon.assert.calledWith(@io.writeJson.getCall(2),
      "#{@buildDir}/configs/regularDrivers.json",
      @hostConfigSet.regularDrivers
    )
    sinon.assert.calledWith(@io.writeJson.getCall(3),
      "#{@buildDir}/configs/systemServices.json",
      @hostConfigSet.systemServices
    )
    sinon.assert.calledWith(@io.writeJson.getCall(4),
      "#{@buildDir}/configs/regularServices.json",
      @hostConfigSet.regularServices
    )
    sinon.assert.calledWith(@io.writeJson.getCall(5),
      "#{@buildDir}/configs/devicesDefinitions.json",
      @hostConfigSet.devicesDefinitions
    )
    sinon.assert.calledWith(@io.writeJson.getCall(6),
      "#{@buildDir}/configs/driversDefinitions.json",
      @hostConfigSet.driversDefinitions
    )
    sinon.assert.calledWith(@io.writeJson.getCall(7),
      "#{@buildDir}/configs/servicesDefinitions.json",
      @hostConfigSet.servicesDefinitions
    )
    sinon.assert.calledWith(@io.writeJson.getCall(8),
      "#{@buildDir}/configs/iosDefinitions.json",
      @hostConfigSet.iosDefinitions
    )
#    sinon.assert.calledWith(@io.writeJson.getCall(8),
#      "/buildDir/hosts/configWorks/usedEntities.json",
#      @entitiesNames
#    )
