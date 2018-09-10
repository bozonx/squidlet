DevicesManager = require('../../host/src/app/entities/DevicesManager').default
initializationConfig = require('../../host/src/app/config/initializationConfig').default


describe 'app.DevicesManager', ->
  beforeEach ->
    @props = undefined
    @device = class
      constructor: (props) ->
        @props = props
      init: sinon.spy()

    @definitions = [
      {
        id: 'room.device1'
        className: 'Relay'
        props: {
          id: 'room.device1'
          otherParam: 1
        }
      }
    ]

    @system = {
      initCfg: initializationConfig()
      configSet: {
        loadEntityClass: => @device
        loadConfig: => @definitions
      }
    }
    @devicesManager = new DevicesManager(@system)

  it 'init() and getDevice', ->
    await @devicesManager.init()

    assert.equal(@devicesManager.getDevice('room.device1').props, @definitions[0].props)
    sinon.assert.calledOnce(@devicesManager.getDevice('room.device1').init)
