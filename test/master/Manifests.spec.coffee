Manifests = require('../../master/Manifests').default


describe 'master.Manifests', ->
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
      buildDir: '/buildDir'
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
    @manifests = new Manifests(@main)

  it 'generate', ->
    @manifests.buildMainFile = sinon.stub().returns(Promise.resolve())

    await @manifests.generate()

    assert.deepEqual(@manifests.getManifests(), {
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

    assert.deepEqual(@manifests.getFiles(), {
      devices: {
        DeviceClass: [
          '/myBaseDir/deviceFile.json'
          '/buildDir/entityBuild/devices_DeviceClass.js'
        ]
      }
      drivers: {
        'DriverName.driver': [
          '/myBaseDir/driverFile.json'
          '/buildDir/entityBuild/drivers_DriverName.driver.js'
        ]
      }
      services: {
        ServiceClass: [
          '/myBaseDir/serviceFile.json'
          '/buildDir/entityBuild/services_ServiceClass.js'
        ]
      }
    })

    assert.deepEqual(@manifests.getDependencies(), {
      devices: {
        DeviceClass: [ 'DriverName.driver' ]
      },
      drivers: {},
      services: {},
    })

    assert.deepEqual(@manifests.getDevDependencies(), {
      devices: {},
      drivers: {},
      services: {
        ServiceClass: [ 'DevName.dev' ]
      },
    })

    assert.deepEqual(@manifests.getSystemDrivers(), [ 'DriverName.driver' ])
    assert.deepEqual(@manifests.getSystemServices(), [ 'ServiceClass' ])

    sinon.assert.calledThrice(@manifests.buildMainFile)
    sinon.assert.calledWith(@manifests.buildMainFile.getCall(0),
      '/myBaseDir/main.ts', '/buildDir/entityBuild/devices_DeviceClass.js')
    sinon.assert.calledWith(@manifests.buildMainFile.getCall(1),
      '/myBaseDir/main.ts', '/buildDir/entityBuild/drivers_DriverName.driver.js')
    sinon.assert.calledWith(@manifests.buildMainFile.getCall(2),
      '/myBaseDir/main.ts', '/buildDir/entityBuild/services_ServiceClass.js')
