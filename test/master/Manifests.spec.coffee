Manifests = require('../../master/Manifests').default


describe.only 'master.Manifests', ->
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
        param: 'value'
      }
    ]
    @prePreDriverManifest = [
      {
        name: 'DriverName.driver'
        baseDir: '/myBaseDir'
        main: './main.ts'
        files: [
          'driverFile.json'
        ]
        param: 'value'
      }
    ]
    @prePreServiceManifest = [
      {
        name: 'ServiceClass'
        baseDir: '/myBaseDir'
        main: './main.ts'
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
    }
    @manifests = new Manifests(@main)

  it 'generate', ->
    @manifests.buildMainFile = sinon.stub().returns(Promise.resolve())

    await @manifests.generate()

    assert.deepEqual(@manifests.getManifests(), {
      devices: {
        DeviceClass: {
          name: 'DeviceClass'
          param: 'value'
        }
      },
      drivers: {
        'DriverName.driver': {
          name: 'DriverName.driver'
          param: 'value'
        }
      },
      services: {
        ServiceClass: {
          name: 'ServiceClass'
          param: 'value'
        }
      },
    })

    assert.deepEqual(@manifests.getFiles(), {
      devices: {
        DeviceClass: [
          '/buildDir/entityBuild/devices_DeviceClass.js'
          '/myBaseDir/deviceFile.json'
        ]
      }
      drivers: {
        'DriverName.driver': [
          '/buildDir/entityBuild/drivers_DriverName.driver.js'
          '/myBaseDir/driverFile.json'
        ]
      }
      services: {
        ServiceClass: [
          '/buildDir/entityBuild/services_ServiceClass.js'
          '/myBaseDir/serviceFile.json'
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

    sinon.assert.calledThrice(@manifests.buildMainFile)
    sinon.assert.calledWith(@manifests.buildMainFile.getCall(0),
      '/myBaseDir/main.ts', '/buildDir/entityBuild/devices_DeviceClass.js')
    sinon.assert.calledWith(@manifests.buildMainFile.getCall(1),
      '/myBaseDir/main.ts', '/buildDir/entityBuild/drivers_DriverName.driver.js')
    sinon.assert.calledWith(@manifests.buildMainFile.getCall(2),
      '/myBaseDir/main.ts', '/buildDir/entityBuild/services_ServiceClass.js')



    # TODO: test dev deps, system drivers and services
