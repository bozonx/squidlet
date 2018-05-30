I2cTunnel = require('../../src/tunnels/I2cTunnel').default
helpers = require('../../src/helpers/helpers')


describe 'tunnels.I2cTunnel', ->
  beforeEach ->
    @listenDataHandler = undefined
    @driver = {
      listenData: (bus, addr, dataAddr, handler) => @listenDataHandler = handler
      writeData: sinon.spy()
    }

    @app = {
      drivers: {
        getDriver: => @driver
      }
    }

    @message = {
      topic: 'room1.host.device1'
    }

    @uint8arr = helpers.stringToUint8Array(JSON.stringify(@message))

    @connectionTo = {
      host: 'room1.host1'
      type: 'i2c'
      bus: '1'
      address: '5A'
    }

    @tunnel = new I2cTunnel(@app, @connectionTo)
    @tunnel.init()

  it 'publish', ->
    await @tunnel.publish(@message)

    sinon.assert.calledWith(@driver.writeData, '1', '5A', 126, @uint8arr)

  it 'subscribe', ->
    handler = sinon.spy()
    @tunnel.subscribe(handler)

    @listenDataHandler(@uint8arr)

    sinon.assert.calledWith(handler, @message)
