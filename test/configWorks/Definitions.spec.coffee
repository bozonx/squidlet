Definitions = require('../../squidlet-starter/build-host-env/Definitions').default
hostDefaultConfig = require('../../squidlet-starter/build-host-env/configs/hostDefaultConfig').default


describe 'configWorks.Definitions', ->
  beforeEach ->
    @main = {
      masterConfig: {
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
              'Digital.driver': {
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
      'Digital.driver': {
        id: 'Digital.driver'
        className: 'Digital.driver'
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
          'Some.driver': {
            manifest: {
              name: 'Some.driver'
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
          'Some.driver': {
            className: 'Some.driver'
          }
        }
      }

    it 'ok', ->
      assert.doesNotThrow(() =>  @definitions.checkDefinitions())


    it 'fail', ->
      @entitiesSet.drivers = {}

      assert.throws(() => @definitions.checkDefinitions())
