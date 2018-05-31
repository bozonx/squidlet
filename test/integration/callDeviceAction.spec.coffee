# Call device's action
# * device places on remote host
# * i2c tunnel uses to connect
# * request does from MQTT backed

{ App } = require('../../src/index').default;

describe 'intergation. Call device\'s action', ->
  beforeEach ->
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

    @app.init()


  it 'just callAction', ->
    await @app.devicesDispatcher.callAction('room.test', 'turn', 1)

  # TODO: call from mqtt backend
