Entities = require('../../master/Entities').default


describe.only 'master.Entities', ->
  beforeEach ->
    @preDevicesManifests = [
      {
        name: 'DeviceClass'
        baseDir: '/myBaseDir'
        main: './main.ts'
        files: [
          'deviceFile.json'
        ]
        drivers: [
          'DriverName.driver'
        ]
        props: {
          props: 'value'
        }
        param: 'value'
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
          'DevName.dev'
        ]
        param: 'value'
      }
    ]
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
      }
    }
    @entities = new Entities(@main)

  it 'generate', ->
    @entities.buildMainFile = sinon.stub().returns(Promise.resolve())

    await @entities.generate()

    assert.deepEqual(@entities.getManifests(), {
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
    })

    assert.deepEqual(@entities.getFiles(), {
      devices: {
        DeviceClass: [
          '/buildDir/entities/devices/DeviceClass/deviceFile.json'
          '/buildDir/entities/devices/DeviceClass/__main.js'
          '/buildDir/entities/devices/DeviceClass/manifest.json'
        ]
      }
      drivers: {
        'DriverName.driver': [
          '/buildDir/entities/drivers/DriverName.driver/driverFile.json'
          '/buildDir/entities/drivers/DriverName.driver/__main.js'
          '/buildDir/entities/drivers/DriverName.driver/manifest.json'
        ]
        # dev which was registered in Register
        "DevName.dev": [
          "/buildDir/entities/drivers/DevName.dev/manifest.json"
        ]
      }
      services: {
        ServiceClass: [
          '/buildDir/entities/services/ServiceClass/serviceFile.json'
          '/buildDir/entities/services/ServiceClass/__main.js'
          '/buildDir/entities/services/ServiceClass/manifest.json'
        ]
      }
    })

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
        ServiceClass: [ 'DevName.dev' ]
      },
    })

    assert.deepEqual(@entities.getSystemDrivers(), [ 'DriverName.driver' ])
    assert.deepEqual(@entities.getSystemServices(), [ 'ServiceClass' ])

    sinon.assert.calledThrice(@entities.buildMainFile)
    sinon.assert.calledWith(@entities.buildMainFile.getCall(0), 'devices', @preDevicesManifests[0])
    sinon.assert.calledWith(@entities.buildMainFile.getCall(1), 'drivers', @prePreDriverManifest[0])
    sinon.assert.calledWith(@entities.buildMainFile.getCall(2), 'services', @prePreServiceManifest[0])
