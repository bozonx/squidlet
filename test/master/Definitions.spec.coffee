Definitions = require('../../master/Definitions').default
hostDefaultConfig = require('../../master/configs/hostDefaultConfig').default


describe.only 'master.Definitions', ->
  beforeEach ->
    @main = {
      masterConfig: {
        hostDefaults: {
          hostDefaultParam: 1
        }
      }
      masterConfigHosts: {
        master: {
          platform: 'rpi'
          devices: {
            room1: {
              relay: {
                device: 'Relay'
                pin: 1
              }
            }
          }
          drivers: {
            'Gpio.driver': {
              param: 1
            }
          }
          services: {
            backend: {
              service: 'Backend'
              param: 1
            }
          }
          devicesDefaults: {
            Relay: {
              baseOne: true
            }
          }
        }
      }
    }
    @definitions = new Definitions(@main)

  it 'generate', ->
    @definitions.checkDefinitions = sinon.spy()

    await @definitions.generate()

    assert.deepEqual(@definitions.getHostDevicesDefinitions('master'), {
      'room1.relay': {
        id: 'room1.relay'
        className: 'Relay'
        props: {
          pin: 1
          baseOne: true
        }
      }
    })
    assert.deepEqual(@definitions.getHostDriversDefinitions('master'), {
      'Gpio.driver': {
        id: 'Gpio.driver'
        className: 'Gpio.driver'
        props: {
          param: 1
        }
      }
    })
    assert.deepEqual(@definitions.getHostServicesDefinitions('master'), {
      backend: {
        id: 'backend'
        className: 'Backend'
        props: {
          param: 1
        }
      }
    })

    sinon.assert.calledOnce(@definitions.checkDefinitions)

  # TODO: test checkDefinitions
