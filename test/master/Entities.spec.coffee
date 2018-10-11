Entities = require('../../configWorks/Entities').default


describe.only 'master.Entities', ->
  beforeEach ->
    @preDevicesManifests = [
      {
        name: 'DeviceClass'
        baseDir: '/myBaseDir'
        main: './main.ts'
        files: [
          './deviceFile.json'
        ]
        drivers: [
          'DriverName.driver'
        ]
        props: {
          propsParam: 'value'
        }
        extParam: 'value'
      }
    ]
    @prePreDriverManifest = [
      {
        name: 'DriverName.driver'
        baseDir: '/myBaseDir'
        main: './main.ts'
        system: true
        files: [
          'driverFile.json'
        ]
        param: 'value'
      }
      # dev
      {
        name: 'DevName.dev'
        dev: true
        param: 'value'
      }
    ]
    @prePreServiceManifest = [
      {
        name: 'ServiceClass'
        baseDir: '/myBaseDir'
        main: './main.ts'
        system: true
        props: './myProps.yaml'
        files: [
          'serviceFile.json'
        ]
        drivers: [
          # dev of platform without a manifest
          'PlatformDev.dev'
        ]
        param: 'value'
      }
    ]
    @finalManifests = {
      devices: {
        DeviceClass: {
          name: 'DeviceClass'
          props: {
            props: 'value'
          }
          param: 'value'
        }
      },
      drivers: {
        'DriverName.driver': {
          name: 'DriverName.driver'
          system: true
          param: 'value'
        }
        'DevName.dev': {
          name: 'DevName.dev'
          dev: true
          param: 'value'
        }
      },
      services: {
        ServiceClass: {
          name: 'ServiceClass'
          system: true
          props: {
            loadedProp: 'value'
          }
          param: 'value'
        }
      },
    }

    @main = {
      masterConfig: {
        buildDir: '/buildDir'
      }
      register: {
        getDevicesPreManifests: => @preDevicesManifests
        getDriversPreManifests: => @prePreDriverManifest
        getServicesPreManifests: => @prePreServiceManifest
      }
      io: {
        loadYamlFile: () =>
          {
            loadedProp: 'value'
          }
        mkdirP: sinon.stub().returns(Promise.resolve())
        copyFile: sinon.stub().returns(Promise.resolve())
      }
      #$writeJson: sinon.stub().returns(Promise.resolve())
    }
    @entities = new Entities(@main)

  it 'generate and getEntitiesSet', ->
    @entities.saveEntityToStorage = sinon.stub().returns(Promise.resolve())

    await @entities.generate()

    assert.deepEqual(@entities.getEntitiesSet(), {
      devices: {
        DeviceClass: {
          srcDir: '/myBaseDir'
          main: './main.ts'
          files: [
            './deviceFile.json'
          ]
          manifest: {
            name: "DeviceClass"
            drivers: [
              'DriverName.driver'
            ]
            props: {
              propsParam: 'value'
            }
            extParam: "value"
          }
        }
      }
      drivers: {
        'DevName.dev': {
          srcDir: undefined
          main: undefined
          files: []
          manifest: {
            name: 'DevName.dev'
            dev: true
            param: 'value'
          }
        }
        'DriverName.driver': {
          srcDir: '/myBaseDir'
          main: './main.ts'
          files: [
            'driverFile.json'
          ]
          manifest: {
            name: 'DriverName.driver'
            system: true
            param: 'value'
          }
        }
      }
      services: {
        ServiceClass: {
          srcDir: '/myBaseDir'
          main: './main.ts'
          files: [
            'serviceFile.json'
          ]
          manifest: {
            name: 'ServiceClass'
            system: true
            drivers: [
              'PlatformDev.dev'
            ]
            props: {
              loadedProp: 'value'
            }
            param: 'value'
          }
        }
      }
    })

  it 'generate and getAllEntitiesNames', ->
    @entities.saveEntityToStorage = sinon.stub().returns(Promise.resolve())

    await @entities.generate()

    assert.deepEqual @entities.getAllEntitiesNames(), {
      devices: [ 'DeviceClass' ]
      drivers: [ 'DriverName.driver', 'DevName.dev' ]
      services: [ 'ServiceClass' ]
    }

  it 'generate and getDependencies, getDevDependencies, getSystemDrivers, getSystemServices, getDevs', ->
    @entities.saveEntityToStorage = sinon.stub().returns(Promise.resolve())

    await @entities.generate()

    assert.deepEqual(@entities.getDependencies(), {
      devices: {
        DeviceClass: [ 'DriverName.driver' ]
      },
      drivers: {},
      services: {},
    })

    assert.deepEqual(@entities.getDevDependencies(), {
      devices: {},
      drivers: {},
      services: {
        ServiceClass: [ 'PlatformDev.dev' ]
      },
    })

    assert.deepEqual(@entities.getDevs(), [
      'DevName.dev'
      'PlatformDev.dev'
    ])

    assert.deepEqual(@entities.getSystemDrivers(), [ 'DriverName.driver' ])
    assert.deepEqual(@entities.getSystemServices(), [ 'ServiceClass' ])

  it 'resolveDeps', ->
    @entities.unsortedDependencies = {
      devices: {
        device1: [ 'Driver1' ]
      }
      drivers: {
        Driver1: [ 'Driver2' ]
      }
      services: {}
    }

    @entities.resolveDeps()

    assert.deepEqual(@entities.unsortedDependencies, {
      devices: {
        device1: [ 'Driver1' ]
      }
      drivers: {
        Driver1: [ 'Driver2' ]
        Driver2: [ 'Driver3' ]
      }
      services: {}
    })
