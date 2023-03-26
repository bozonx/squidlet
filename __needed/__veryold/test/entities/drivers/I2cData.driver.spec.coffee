I2cData = require('../../../../../../squidlet-networking/src/drivers/I2cData/I2cData').default
helpers = require('../../../../system/helpers/helpers')


describe 'I2cData.driver', ->
  beforeEach ->
    @dataMark = 0x01
    @remoteAddress = '5a'
    @bus = 1

    @data = new Uint8Array(2)
    @data[0] = 255
    @data[1] = 255

    @lengthToSend = new Uint8Array([ 1, 0, 2 ])

    @listenHandlers = []
    @i2cDriverInstance = {
      write: sinon.stub().returns(Promise.resolve())
      read: => @data
      listenIncome: (i2cAddress, dataAddress, length, handler) => @listenHandlers.push(handler)
      removeListener: sinon.spy()
    }
    @i2cDriver = getInstance: => @i2cDriverInstance

    @i2cData = new I2cData(@drivers, {}).getInstance(@i2cDriver, @bus, @remoteAddress)

  it 'send', ->
    await @i2cData.send(@remoteAddress, @dataMark, @data)

    sinon.assert.calledWith(@i2cDriverInstance.write.getCall(0), @remoteAddress, 0x1a, @lengthToSend)
    dataToSend = new Uint8Array(@data)
    sinon.assert.calledWith(@i2cDriverInstance.write.getCall(1), @remoteAddress, 0x1b, dataToSend)

  it 'listenIncome', ->
    handler = sinon.spy()
    otherHandler = sinon.spy()
    @i2cData.listenIncome(@remoteAddress, @dataMark, handler)
    @i2cData.listenIncome(@remoteAddress, 5, otherHandler)

    await @listenHandlers[0](null, @lengthToSend)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, null, @data)
    sinon.assert.notCalled(otherHandler)

  it 'removeListener', ->
    handler = sinon.spy()
    @i2cData.listenIncome(@remoteAddress, @dataMark, handler)

    assert.equal(@i2cData.handlersManager.handlers['5a-1'].length, 1)

    @i2cData.removeListener(@remoteAddress, @dataMark, handler)

    sinon.assert.notCalled(handler)
    sinon.assert.calledWith(@i2cDriverInstance.removeListener, @remoteAddress, @i2cData.lengthRegister)
    assert.deepEqual(@i2cData.handlersManager.handlers, {})
