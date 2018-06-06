I2cConnection = require('../../src/messenger/connections/ConnectionI2c.driver').default
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

    @connection = new I2cConnection(@app, @connectionTo)
    @connection.init()

  it 'send', ->
    await @connection.send(@message)

    sinon.assert.calledWith(@driver.write, '1', '5A', @uint8arr)

  it 'listenIncome', ->
    handler = sinon.spy()
    @connection.listenIncome(handler)

    @listenDataHandler(@uint8arr)

    sinon.assert.calledWith(handler, @message)
