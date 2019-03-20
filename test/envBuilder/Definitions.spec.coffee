Definitions = require('../../hostEnvBuilder/configSet/Definitions').default


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
        Relay: {
          commonProp: 'default'
          hostProp: 1
        }
      }
    }

    @usedEntities = {
      getEntitiesNames: () => @entitiesNames
      getEntitySet: (type, name) => @entitiesSet[type][name]
    }

    @definitions = new Definitions(@configManager, @usedEntities)


  it 'generate', ->
    await @definitions.generate()

    assert.deepEqual(@definitions.getDevicesDefinitions('master'), {
      'room1.relay': {
        id: 'room1.relay'
        className: 'Relay'
        props: {
          commonProp: 'def'
          defProp: 1
          entityProp: 1
          hostProp: 1
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
