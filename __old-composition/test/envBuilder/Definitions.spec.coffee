Definitions = require('../../hostEnvBuilder/configSet/Definitions').default


describe 'envBuilder.Definitions', ->
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
                type: 'string'
                default: 'entity'
              }
              entityProp: {
                type: 'number'
                default: 1
              }
              defProp: {
                type: 'number'
              }
              hostProp: {
                type: 'number'
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
                type: 'string'
                default: 'entity'
              }
              entityProp: {
                type: 'number'
                default: 1
              }
              defProp: {
                type: 'number'
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
                type: 'string'
                default: 'entity'
              }
              entityProp: {
                type: 'number'
                default: 1
              }
              defProp: {
                type: 'number'
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
      iosDefinitions: {
        MyDev: { param: 1 }
      }
    }

    @usedEntities = {
      getEntitiesNames: () => @entitiesNames
      getEntitySet: (type, name) => @entitiesSet[type][name]
    }

    @definitions = new Definitions(@configManager, @usedEntities)


  it 'generate', ->
    await @definitions.generate()

    assert.deepEqual(@definitions.getDevicesDefinitions(), {
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
    assert.deepEqual(@definitions.getDriversDefinitions(), {
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
    assert.deepEqual(@definitions.getServicesDefinitions(), {
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
    assert.deepEqual(@definitions.getIosDefinitions(), {
      MyDev: { param: 1 }
    })
