I2cConnection = require('../../src/network/connections/I2C.connection.driver').default
helpers = require('../../src/helpers/helpers')


describe 'connections.I2cConnection', ->
  beforeEach ->
    @listenDataHandler = undefined
    @driver = {
      send: sinon.spy()
      listenIncome: (remoteAddress, mark, handler) => @listenDataHandler = handler
    }
    @remoteAddress = '5a'
    @drivers = {
      getDriver: => {
        getInstance: => @driver
      }
    }

    @message = {
      topic: 'room1.host.device1'
    }

    @uint8arr = helpers.textToUint8Array(JSON.stringify(@message))

    @myAddress = {
      type: 'i2c'
      bus: '1'
      address: undefined
    }

    @connection = new I2cConnection(@drivers, {}).getInstance(@myAddress)

  it 'send', ->
    await @connection.send(@remoteAddress, @message)

    sinon.assert.calledWith(@driver.send, @remoteAddress, 0x01, @uint8arr)

  it 'listenIncome', ->
    handler = sinon.spy()
    @connection.listenIncome(@remoteAddress, handler)

    @listenDataHandler(null, @uint8arr)

    sinon.assert.calledWith(handler, null, @message)
