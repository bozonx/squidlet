I2cData = require('../../src/drivers/I2cData.driver').default
helpers = require('../../src/helpers/helpers')


describe.only 'I2cData.driver', ->
  beforeEach ->
    @listenDataHandler = undefined
    @i2cDriverInstance = {
      write: sinon.stub().returns(Promise.resolve())
      listen: (mark, handler) => @listenDataHandler = handler
    }
    @i2cDriver = getInstance: => @i2cDriverInstance

    @dataMark = 0x01
    @data = new Uint8Array(2);
    @data[0] = 255;
    @data[1] = 255;

    @connectionTo = {
      type: 'i2c'
      bus: '1'
      address: '5a'
    }

    @i2cData = new I2cData(@drivers, {}).getInstance(@i2cDriver, @connectionTo)

  it 'send', ->
    await @i2cData.send(@dataMark, @data)

    lengthToSend = new Uint8Array([ 2 ])
    sinon.assert.calledWith(@i2cDriverInstance.write.getCall(0), 0x1a, lengthToSend)
    dataToSend = new Uint8Array([ 1, 255, 255 ])
    sinon.assert.calledWith(@i2cDriverInstance.write.getCall(1), 0x1b, dataToSend)

  it 'listenIncome', ->

    # TODO: !!!!!

#    handler = sinon.spy()
#    @connection.listenIncome(handler)
#
#    @listenDataHandler(@uint8arr)
#
#    sinon.assert.calledWith(handler, @message)
