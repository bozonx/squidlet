Definitions = require('../../hostEnvBuilder/configSet/Definitions').default
#hostDefaultConfig = require('../../hostEnvBuilder/configs/hostDefaultConfig').default


describe.only 'envBuilder.Definitions', ->
  beforeEach ->
    @entitiesNames = {
      devices: ['Relay']
      drivers: ['Digital']
      services: ['Logger']
    }

    # manifests
    @entitiesSet = {
      devices: {
        Relay: {
          manifest: {
            props: {
              commonProp: {
                default: 'entity'
              }
              entityProp: {
                default: 1
              }
            }
          }
        }
      }
      drivers: {
        Digital: {
          manifest: {
            props: {
              commonProp: {
                default: 'entity'
              }
              entityProp: {
                default: 1
              }
            }
          }
        }
      }
      services: {
        Logger: {
          manifest: {
            props: {
              commonProp: {
                default: 'entity'
              }
              entityProp: {
                default: 1
              }
            }
          }
        }
      }
    }

    @configManager = {
      preEntities: {
        devices: {
          'room1.relay': {
            className: 'Relay'
            commonProp: 'def'
            defProp: 1
          }
        }
        drivers: {
          Digital: {
            className: 'Digital'
            commonProp: 'def'
            defProp: 1
          }
        }
        services: {
          logger: {
            className: 'Logger'
            commonProp: 'def'
            defProp: 1
          }
        }
      }
      devicesDefaults: {
#        Relay: {
#          baseOne: true
#        }
      }
    }

    @usedEntities = {
      getEntitiesNames: () => @entitiesNames
      getEntitySet: (type, name) => @entitiesSet[type][name]
    }

    @definitions = new Definitions(@configManager, @usedEntities)

  # TODO: test devicesDefaults

  it 'generate', ->
    #@definitions.checkDefinitions = sinon.spy()

    await @definitions.generate()

    assert.deepEqual(@definitions.getDevicesDefinitions('master'), {
      'room1.relay': {
        id: 'room1.relay'
        className: 'Relay'
        props: {
          commonProp: 'def'
          defProp: 1
          entityProp: 1
        }
      }
    })
    assert.deepEqual(@definitions.getDriversDefinitions('master'), {
      'Digital': {
        id: 'Digital'
        className: 'Digital'
        props: {
          commonProp: 'def'
          defProp: 1
          entityProp: 1
        }
      }
    })
    assert.deepEqual(@definitions.getServicesDefinitions('master'), {
      logger: {
        id: 'logger'
        className: 'Logger'
        props: {
          commonProp: 'def'
          defProp: 1
          entityProp: 1
        }
      }
    })

    #sinon.assert.calledOnce(@definitions.checkDefinitions)

#  describe 'checkDefinitions', ->
#    beforeEach ->
#      @entitiesSet = {
#        # the same for devices and services
#        drivers: {
#          'Some': {
#            manifest: {
#              name: 'Some'
#            }
#            main: './main.ts'
#            files: []
#          }
#        }
#      }
#      @definitions.main.entities = {
#        getEntitiesSet: => @entitiesSet
#      }
#      @definitions.driversDefinitions = {
#        master: {
#          'Some': {
#            className: 'Some'
#          }
#        }
#      }
#
#    it 'ok', ->
#      assert.doesNotThrow(() =>  @definitions.checkDefinitions())
#
#
#    it 'fail', ->
#      @entitiesSet.drivers = {}
#
#      assert.throws(() => @definitions.checkDefinitions())
