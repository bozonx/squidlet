# Call device's action
# * device places on remote host
# * i2c connection uses to connect
# * request does from MQTT backed

{ App } = require('../../src/index').default;

describe.skip 'intergation. Call device\'s action', ->
  beforeEach ->

    # TODO: mock device class load
    # TODO: mock i2cData
    # TODO: mock host

    @config = {
      devices: {
        room: {
          test: {
            device: 'TestDevice'
            deviceParam: 'param'
          }
        }
      }
    }

    @TestDevice = class
      constructor: (app, deviceConf) ->
      turn: () ->


    @app = new App()

    await @app.init()


  it 'just callAction', ->
    await @app.devices.callAction('room.test', 'turn', 1)

  # TODO: call from mqtt backend
