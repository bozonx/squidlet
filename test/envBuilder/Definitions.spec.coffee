Definitions = require('../../hostEnvBuilder/configSet/Definitions').default
hostDefaultConfig = require('../../hostEnvBuilder/configs/hostDefaultConfig').default


describe.only 'envBuilder.Definitions', ->
  beforeEach ->
    @main = {
      configManager: {
        hostDefaults: {
          hostDefaultParam: 1
        }
        getHostsIds: => ['master']
        getPreHostConfig: =>
          {
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
              'Digital': {
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
      entities: {
        getManifest: =>
          {
            props: {
              manifestProp: 'value'
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
          manifestProp: 'value'
        }
      }
    })
    assert.deepEqual(@definitions.getHostDriversDefinitions('master'), {
      'Digital': {
        id: 'Digital'
        className: 'Digital'
        props: {
          param: 1
          manifestProp: 'value'
        }
      }
    })
    assert.deepEqual(@definitions.getHostServicesDefinitions('master'), {
      backend: {
        id: 'backend'
        className: 'Backend'
        props: {
          param: 1
          manifestProp: 'value'
        }
      }
    })

    sinon.assert.calledOnce(@definitions.checkDefinitions)

  describe 'checkDefinitions', ->
    beforeEach ->
      @entitiesSet = {
        # the same for devices and services
        drivers: {
          'Some': {
            manifest: {
              name: 'Some'
            }
            main: './main.ts'
            files: []
          }
        }
      }
      @definitions.main.entities = {
        getEntitiesSet: => @entitiesSet
      }
      @definitions.driversDefinitions = {
        master: {
          'Some': {
            className: 'Some'
          }
        }
      }

    it 'ok', ->
      assert.doesNotThrow(() =>  @definitions.checkDefinitions())


    it 'fail', ->
      @entitiesSet.drivers = {}

      assert.throws(() => @definitions.checkDefinitions())
