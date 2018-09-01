Manifests = require('../../master/Manifests').default


describe 'devices.BinarySensor', ->
  beforeEach ->
    @preDevicesManifests = [
      {
        device: 'DeviceClass',
        param: 'value'
      }
    ]
    @prePreDriverManifest = [
      {
        driver: 'DeviceClass',
        param: 'value'
      }
    ]
    @prePreServiceManifest = [
      {
        service: 'DeviceClass',
        param: 'value'
      }
    ]
    @main = {
      register: {
        getDevicesPreManifests: => @preDevicesManifests
        getDriversPreManifests: => @prePreDriverManifest
        getServicesPreManifests: => @prePreServiceManifest
      }
    }
    @manifests = new Manifests(@main)

  it 'generate', ->
    await @manifests.generate()


