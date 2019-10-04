DevicesManager = require('../../../system/managers/DevicesManager').default
#initializationConfig = require('../../../system/initializationConfig').default


describe 'app.DevicesManager', ->
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
      host: {
        config: {}
      }
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
