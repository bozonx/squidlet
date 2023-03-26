# Call device's action
# * device places on remote host
# * i2c connection uses to connect
# * request does from MQTT backed

System = require('../../../system/System').default;

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


    @system = new System()

    await @system.init()


  it 'just callAction', ->
    await @system.devices.callAction('room.test', 'turn', 1)

  # TODO: call from mqtt backend
