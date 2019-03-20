UsedEntities = require('../../hostEnvBuilder/entities/UsedEntities').default


describe.only 'envBuilder.UsedEntities', ->
  beforeEach ->
    @manifests = {
      devices: {
        DeviceClass: {
          name: 'DeviceClass'
          main: '../main.ts'
          baseDir: '/myBaseDir'
          files: [
            './deviceFile.json'
          ]
          drivers: [
            'DepDriver'
          ]
          props: {
            propsParam: 'value'
          }
          extParam: 'value'
        }
      }
      drivers: {
        MyDriver: {
          name: 'MyDriver'
          main: './main.ts'
          baseDir: '/myBaseDir'
          devs: ['MyDev']
        }
        DepDriver: {
          name: 'DepDriver'
          main: './main.ts'
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

    @usedEntities = new UsedEntities(@io, @configManager, @register)


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
              propsParam: 'value'
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

  it 'generate and getUsedDevs', ->
    await @usedEntities.generate()

    assert.deepEqual(@usedEntities.getUsedDevs(), ['MyDev'])
