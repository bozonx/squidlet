I2cData = require('../../src/drivers/I2cData.driver').default
helpers = require('../../src/helpers/helpers')


describe.only 'I2cData.driver', ->
  beforeEach ->
    @listenHandler = undefined
    @i2cDriverInstance = {
      write: sinon.stub().returns(Promise.resolve())
      listen: (dataAddress, length, handler) => @listenHandler = handler
      removeListener: ->
    }
    @i2cDriver = getInstance: => @i2cDriverInstance
    @remoteAddress = '5a'
    @dataMark = 0x01

    @data = new Uint8Array(2)
    @data[0] = 255
    @data[1] = 255

    @lengthToSend = new Uint8Array([ 0, 2 ])
    @dataToSend = new Uint8Array([ 1, 255, 255 ])

    @bus = 1
    @address = '5a'

    @i2cData = new I2cData(@drivers, {}).getInstance(@i2cDriver, @bus, @address)

  it 'send', ->
    await @i2cData.send(@remoteAddress, @dataMark, @data)

    sinon.assert.calledWith(@i2cDriverInstance.write.getCall(0), @remoteAddress, 0x1a, @lengthToSend)
    dataToSend = new Uint8Array(@dataToSend)
    sinon.assert.calledWith(@i2cDriverInstance.write.getCall(1), @remoteAddress, 0x1b, dataToSend)

  it 'listenIncome', ->
    handler = sinon.spy()
    otherHandler = sinon.spy()
    @i2cData.listenIncome(@dataMark, handler)
    @i2cData.listenIncome(5, handler)

    @listenHandler(@lengthToSend)
    @listenHandler(@dataToSend)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, @data)
    sinon.assert.notCalled(otherHandler)
