UsedEntities = require('../../hostEnvBuilder/entities/UsedEntities').default


describe 'envBuilder.UsedEntities', ->
  beforeEach ->
    @manifests = {
      devices: {
        DeviceClass: {
          name: 'DeviceClass'
          main: 'main.ts'
          baseDir: '/myBaseDir'
          files: [
            './deviceFile.json'
          ]
          drivers: [
            'DepDriver'
          ]
          props: {
            propsParam: { type: 'string', default: 'value' }
          }
          extParam: 'value'
        }
      }
      drivers: {
        MyDriver: {
          name: 'MyDriver'
          main: 'main.ts'
          baseDir: '/myBaseDir'
          ios: ['MyIo']
        }
        DepDriver: {
          name: 'DepDriver'
          main: 'main.ts'
          baseDir: '/myBaseDir'
        }
      }
      services: {
        MyService: {
          name: 'MyService'
          main: 'main.ts'
          baseDir: '/myBaseDir'
          system: true
        }
      }
    }

    @register = {
      getEntityManifest: (pluralType, className) => @manifests[pluralType][className]
    }

    @configManager = {
      preEntities: {
        devices: {
          myDevice: {
            className: 'DeviceClass'
          }
        }
        drivers: {
          MyDriver: {
            className: 'MyDriver'
          }
        }
        services: {
          MyService: {
            className: 'MyService'
          }
        }
      }
    }
    @io = {
      loadYamlFile: () =>
        {
          loadedProp: 'value'
        }
    }

    @usedEntities = new UsedEntities(@configManager, @register)


  it 'generate and getEntitiesSet', ->
    await @usedEntities.generate()

    assert.deepEqual(@usedEntities.getEntitiesSet(), {
      devices: {
        DeviceClass: {
          srcDir: '/myBaseDir'
          files: [
            './deviceFile.json'
          ]
          system: false
          manifest: {
            name: 'DeviceClass'
            main: 'main.ts'
            props: {
              propsParam: { type: 'string', default: 'value' }
            }
            extParam: "value"
          }
        }
      }
      drivers: {
        DepDriver: {
          srcDir: '/myBaseDir'
          files: []
          system: false
          manifest: {
            name: 'DepDriver'
            main: 'main.ts'
          }
        }
        MyDriver: {
          srcDir: '/myBaseDir'
          files: []
          system: false
          manifest: {
            name: 'MyDriver'
            main: 'main.ts'
          }
        }
      }
      services: {
        MyService: {
          srcDir: '/myBaseDir'
          files: []
          system: true
          manifest: {
            name: 'MyService'
            main: 'main.ts'
          }
        }
      }
    })

  it 'generate and getEntitiesNames', ->
    await @usedEntities.generate()

    assert.deepEqual(@usedEntities.getEntitiesNames(), {
      devices: ['DeviceClass']
      drivers: ['DepDriver', 'MyDriver']
      services: ['MyService']
    })

  it 'generate and getUsedIo', ->
    await @usedEntities.generate()

    assert.deepEqual(@usedEntities.getUsedIo(), ['MyIo'])

  it 'mergePropsSchema', ->
    @manifests.devices.DeviceClass.props = {
      $base: 'drivers.MyDriver'
      topParam: {
        type: 'string'
        default: 'top'
      }
    }

    @manifests.drivers.MyDriver.props = {
      $base: 'services.MyService'
      topParam: {
        type: 'string'
        default: 'mid'
      }
      midParam: {
        type: 'string'
        default: 'mid'
      }
    }

    @manifests.services.MyService.props = {
      topParam: {
        type: 'string'
        default: 'bottom'
      }
      midParam: {
        type: 'string'
        default: 'bottom'
      }
      bottomParam: {
        type: 'string'
        default: 'bottom'
      }
    }

    await @usedEntities.generate()

    assert.deepEqual(@usedEntities.getEntitiesSet(), {
      devices: {
        DeviceClass: {
          srcDir: '/myBaseDir'
          files: [
            './deviceFile.json'
          ]
          system: false
          manifest: {
            name: 'DeviceClass'
            main: 'main.ts'
            props: {
              topParam: {
                type: 'string'
                default: 'top'
              }
              midParam: {
                type: 'string'
                default: 'mid'
              }
              bottomParam: {
                type: 'string'
                default: 'bottom'
              }
            }
            extParam: "value"
          }
        }
      }
      drivers: {
        DepDriver: {
          srcDir: '/myBaseDir'
          files: []
          system: false
          manifest: {
            name: 'DepDriver'
            main: 'main.ts'
          }
        }
        MyDriver: {
          srcDir: '/myBaseDir'
          files: []
          system: false
          manifest: {
            name: 'MyDriver'
            main: 'main.ts'
            props: {
              topParam: {
                type: 'string'
                default: 'mid'
              }
              midParam: {
                type: 'string'
                default: 'mid'
              }
              bottomParam: {
                type: 'string'
                default: 'bottom'
              }
            }
          }
        }
      }
      services: {
        MyService: {
          srcDir: '/myBaseDir'
          files: []
          system: true
          manifest: {
            name: 'MyService'
            main: 'main.ts'
            props: {
              topParam: {
                type: 'string'
                default: 'bottom'
              }
              midParam: {
                type: 'string'
                default: 'bottom'
              }
              bottomParam: {
                type: 'string'
                default: 'bottom'
              }
            }
          }
        }
      }
    })
