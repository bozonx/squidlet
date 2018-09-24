DevicesManager = require('../../host/src/app/entities/DevicesManager').default
initializationConfig = require('../../host/src/app/config/initializationConfig').default


describe.only 'app.DevicesManager', ->
  beforeEach ->
    @device = class
      constructor: (definition) ->
        @definition = definition
      init: sinon.spy()

    @definitions = [
      {
        id: 'room.device1'
        className: 'Relay'
        props: {
          otherParam: 1
        }
      }
    ]

    @system = {
      initCfg: initializationConfig()
      configSet: {
        loadMain: => @device
        loadConfig: => @definitions
      }
    }
    @devicesManager = new DevicesManager(@system)

  it 'init() and getDevice', ->
    await @devicesManager.init()

    assert.equal(@devicesManager.getDevice('room.device1').definition, @definitions[0])
    sinon.assert.calledOnce(@devicesManager.getDevice('room.device1').init)
