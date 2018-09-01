Manifests = require('../../master/Manifests').default


describe.only 'master.Manifests', ->
  beforeEach ->
    @preDevicesManifests = [
      {
        name: 'DeviceClass'
        baseDir: '/myBaseDir'
        main: './main.ts'
        param: 'value'
      }
    ]
    @prePreDriverManifest = [
      {
        name: 'DriverClass'
        baseDir: '/myBaseDir'
        main: './main.ts'
        param: 'value'
      }
    ]
    @prePreServiceManifest = [
      {
        name: 'ServiceClass'
        baseDir: '/myBaseDir'
        main: './main.ts'
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
        DriverClass: {
          name: 'DriverClass'
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

    sinon.assert.calledThrice(@manifests.buildMainFile)
    sinon.assert.calledWith(@manifests.buildMainFile.getCall(0),
      '/myBaseDir/main.ts', '/buildDir/entityBuild/devices_DeviceClass.js')
    sinon.assert.calledWith(@manifests.buildMainFile.getCall(1),
      '/myBaseDir/main.ts', '/buildDir/entityBuild/drivers_DriverClass.js')
    sinon.assert.calledWith(@manifests.buildMainFile.getCall(2),
      '/myBaseDir/main.ts', '/buildDir/entityBuild/services_ServiceClass.js')

    # TODO: test files, etc
