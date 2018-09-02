HostsFilesWriter = require('../../master/HostsFilesWriter').default


describe.only 'master.HostsFilesWriter', ->
  beforeEach ->
    @main = {
      buildDir: '/bildDir'
      hostsFilesSet: {
        getCollection: =>
          {
            master: {
              # TODO: review
              config: {
                host: {
                  param: 1
                }
              }
            }
          }
      }
    }
    @hostsFilesWriter = new HostsFilesWriter(@main)

  it 'writeToStorage', ->
    configDir = '/bildDir/hosts/master/config'
    @hostsFilesWriter.writeJson = sinon.spy()

    await @hostsFilesWriter.writeToStorage()

    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(0),
      "#{configDir}/hostConfig.json"
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(1),
      "#{configDir}/systemDrivers.json"
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(2),
      "#{configDir}/regularDrivers.json"
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(3),
      "#{configDir}/systemServices.json"
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(4),
      "#{configDir}/regularServices.json"
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(5),
      "#{configDir}/devicesDefinitions.json"
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(6),
      "#{configDir}/driversDefinitions.json"
    )
    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(7),
      "#{configDir}/servicesDefinitions.json"
    )

    sinon.assert.calledWith(@hostsFilesWriter.writeJson.getCall(8),
      "/bildDir/hosts/master/entitiesFiles.json"
    )
