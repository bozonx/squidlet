I2cTunnel = require('../../src/tunnels/I2cTunnel')


describe 'tunnels.I2cTunnel', ->
  beforeEach ->
    @driver = {
      listenData: ->
      writeData: sinon.spy()
    }

    @app = {
      drivers: {
        getDriver: => @driver
      }
    }

    @message = {
      topic: 'room1.host.device1'
#      category: 'deviceCallAction'
#      from: {
#        hostId: 'master'
#        type: 'i2c'
#        bus: '1'
#        address: undefined
#      }
#      to:{
#        hostId: 'room1.host1'
#        type: 'i2c'
#        bus: '1'
#        address: '5A'
#      }
#      payload: {
#        myData: 'data'
#      }
    }

    @connectionTo = {
      hostId: 'room1.host1'
      type: 'i2c'
      bus: '1'
      address: '5A'
    }

    @tunnel = new I2cTunnel(@app, @connectionTo)

  it 'publish', ->
    await @tunnel.publish(@message)

    sinon.assert.calledWith(@driver.writeData, '1', '5a', )
