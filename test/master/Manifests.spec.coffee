Manifests = require('../../master/Manifests').default


describe.only 'master.Manifests', ->
  beforeEach ->
    @preDevicesManifests = [
      {
        main: 'DeviceClass'
        baseDir: '/myBaseDir'
        main: './main.ts'
        param: 'value'
      }
    ]
    @prePreDriverManifest = [
      {
        main: 'DriverClass'
        baseDir: '/myBaseDir'
        main: './main.ts'
        param: 'value'
      }
    ]
    @prePreServiceManifest = [
      {
        main: 'ServiceClass'
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
    await @manifests.generate()

    assert.deepEqual(@manifests.getManifests(), {
      device: {
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

    # TODO: test files, etc
