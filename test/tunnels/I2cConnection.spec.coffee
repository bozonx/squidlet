I2cConnection = require('../../src/connections/I2cConnection').default
helpers = require('../../src/helpers/helpers')


describe 'connections.I2cConnection', ->
  beforeEach ->
    @listenDataHandler = undefined
    @driver = {
      listen: (bus, addr, handler) => @listenDataHandler = handler
      write: sinon.spy()
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

    @tunnel = new I2cConnection(@app, @connectionTo)
    @tunnel.init()

  it 'publish', ->
    await @tunnel.publish(@message)

    sinon.assert.calledWith(@driver.write, '1', '5A', @uint8arr)

  it 'subscribe', ->
    handler = sinon.spy()
    @tunnel.subscribe(handler)

    @listenDataHandler(@uint8arr)

    sinon.assert.calledWith(handler, @message)
