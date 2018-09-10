Entities = require('../../configWorks/Entities').default


describe 'master.Entities', ->
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
      $writeJson: sinon.stub().returns(Promise.resolve())
    }
    @entities = new Entities(@main)

  it 'generate', ->
    @entities.saveEntityToStorage = sinon.stub().returns(Promise.resolve())

    await @entities.generate()

    assert.deepEqual(@entities.getManifests(), @finalManifests)

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
        ServiceClass: [ 'PlatformDev.dev' ]
      },
    })

    assert.deepEqual(@entities.getSystemDrivers(), [ 'DriverName.driver' ])
    assert.deepEqual(@entities.getSystemServices(), [ 'ServiceClass' ])

    assert.equal(@entities.saveEntityToStorage.callCount, 4)
    sinon.assert.calledWith(@entities.saveEntityToStorage.getCall(0),
      @preDevicesManifests[0], @finalManifests.devices.DeviceClass, '/buildDir/entities/devices/DeviceClass')
    sinon.assert.calledWith(@entities.saveEntityToStorage.getCall(1),
      @prePreDriverManifest[0], @finalManifests.drivers['DriverName.driver'], '/buildDir/entities/drivers/DriverName.driver')
    sinon.assert.calledWith(@entities.saveEntityToStorage.getCall(2),
      # save new dev to storage
      @prePreDriverManifest[1], @finalManifests.drivers['DevName.dev'], '/buildDir/entities/drivers/DevName.dev')
    sinon.assert.calledWith(@entities.saveEntityToStorage.getCall(3),
      @prePreServiceManifest[0], @finalManifests.services.ServiceClass, '/buildDir/entities/services/ServiceClass')

  it 'saveEntityToStorage', ->
    await @entities.saveEntityToStorage(
      @preDevicesManifests[0],
      @finalManifests.devices.DeviceClass,
      '/buildDir/entities/devices/DeviceClass'
    );

    sinon.assert.calledOnce(@main.io.mkdirP)
    sinon.assert.calledOnce(@main.io.copyFile)
    sinon.assert.calledWith(@main.io.mkdirP, '/buildDir/entities/devices/DeviceClass')
    sinon.assert.calledWith(@main.io.copyFile, '/myBaseDir/deviceFile.json', '/buildDir/entities/devices/DeviceClass/deviceFile.json')

    sinon.assert.calledOnce(@main.$writeJson)
    sinon.assert.calledWith(@main.$writeJson,
      '/buildDir/entities/devices/DeviceClass/manifest.json',
      @finalManifests.devices.DeviceClass)

  it 'getDevs', ->
    await @entities.generate()

    assert.deepEqual(@entities.getDevs(), [
      'DevName.dev'
      'PlatformDev.dev'
    ])
