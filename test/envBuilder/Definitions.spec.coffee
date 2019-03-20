Definitions = require('../../hostEnvBuilder/configSet/Definitions').default
#hostDefaultConfig = require('../../hostEnvBuilder/configs/hostDefaultConfig').default


describe.only 'envBuilder.Definitions', ->
  beforeEach ->
    @entitiesNames = {
      devices: ['Relay']
      drivers: ['Digital']
      services: ['Logger']
    }

    @entitiesSet = {
      devices: {
        manifest: {
          props: {

          }
        }
      }
      drivers: {
        manifest: {
          props: {

          }
        }
      }
      services: {
        manifest: {
          props: {

          }
        }
      }
    }

    @configManager = {
      preEntities: {
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
            driver: 'Digital'
            param: 1
          }
        }
        services: {
          logger: {
            service: 'Logger'
            param: 1
          }
        }
      }
      devicesDefaults: {

#        Relay: {
#          baseOne: true
#        }
      }
    }

    @usedEntities = {
      getEntitiesNames: () => @entitiesNames
      getEntitySet: (type, name) => @entitiesSet[type][name]
    }

    @definitions = new Definitions(@configManager, @usedEntities)

  # TODO: test devicesDefaults

  it 'generate', ->
    #@definitions.checkDefinitions = sinon.spy()

    await @definitions.generate()

    assert.deepEqual(@definitions.getDevicesDefinitions('master'), {
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
    assert.deepEqual(@definitions.getDriversDefinitions('master'), {
      'Digital': {
        id: 'Digital'
        className: 'Digital'
        props: {
          param: 1
          manifestProp: 'value'
        }
      }
    })
    assert.deepEqual(@definitions.getServicesDefinitions('master'), {
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

#  describe 'checkDefinitions', ->
#    beforeEach ->
#      @entitiesSet = {
#        # the same for devices and services
#        drivers: {
#          'Some': {
#            manifest: {
#              name: 'Some'
#            }
#            main: './main.ts'
#            files: []
#          }
#        }
#      }
#      @definitions.main.entities = {
#        getEntitiesSet: => @entitiesSet
#      }
#      @definitions.driversDefinitions = {
#        master: {
#          'Some': {
#            className: 'Some'
#          }
#        }
#      }
#
#    it 'ok', ->
#      assert.doesNotThrow(() =>  @definitions.checkDefinitions())
#
#
#    it 'fail', ->
#      @entitiesSet.drivers = {}
#
#      assert.throws(() => @definitions.checkDefinitions())
