I2cConnection = require('../../plugin-bridge/network/connections/I2c.connection.driver').default
helpers = require('../../../../../../../squidlet-lib/src/binaryHelpers')


describe 'connections.I2cConnection', ->
  beforeEach ->
    @listenDataHandler = undefined
    @driver = {
      send: sinon.spy()
      listenIncome: (remoteAddress, mark, handler) => @listenDataHandler = handler
      removeListener: sinon.spy()
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

    @uint8arr = helpers.utf8TextToUint8Array(JSON.stringify(@message))

    @myAddress = {
      type: 'i2c'
      bus: '1'
      address: undefined
    }

    @connection = new I2cConnection(@drivers, {}).subDriver(@myAddress)

  it 'send', ->
    await @connection.send(@remoteAddress, @message)

    sinon.assert.calledWith(@driver.send, @remoteAddress, 0x01, @uint8arr)

  it 'listenIncome', ->
    handler = sinon.spy()
    @connection.listenIncome(@remoteAddress, handler)

    @listenDataHandler(null, @uint8arr)

    sinon.assert.calledWith(handler, null, @message)

  it 'removeListener', ->
    handler = sinon.spy()
    @connection.listenIncome(@remoteAddress, handler)

    assert.equal(@connection.handlersManager.handlers['5a'].length, 1)

    @connection.removeListener(@remoteAddress, handler)

    sinon.assert.notCalled(handler)
    sinon.assert.calledWith(@driver.removeListener, @remoteAddress, 0x01)
    assert.deepEqual(@connection.handlersManager.handlers, {})
