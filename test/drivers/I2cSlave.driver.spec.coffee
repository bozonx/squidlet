I2cSlave = require('../../src/drivers/I2cSlave.driver').default


describe.only 'I2cMaster.driver', ->
  beforeEach ->
    @listenHanlder = undefined
    @i2cSlaveDevInstance = {
      send: sinon.stub().returns(Promise.resolve())
      listenIncome: (handler) => @listenHanlder = handler
    }
    @i2cSlaveDev = getInstance: => @i2cSlaveDevInstance
    @bus = 1
    @dataAddrHex = 0x1a
    @data = new Uint8Array(1)
    @data[0] = 255

    @drivers = {
      getDriver: => @i2cSlaveDev
    }

    @i2cSlave = new I2cSlave(@drivers, {}).getInstance(@bus)

#  it 'write to dataAddress', ->
#    await @i2cSlave.write(undefined , @dataAddrHex, @data)
#
#    dataToWrite = new Uint8Array(2)
#    dataToWrite[0] = @dataAddrHex
#    dataToWrite[1] = @data[0]
#
#    sinon.assert.calledWith(@i2cDevInstance.writeTo, @addressHex, dataToWrite)
#
#  it 'write without dataAddress', ->
#    await @i2cMaster.write(@address, undefined, @data)
#
#    sinon.assert.calledWith(@i2cDevInstance.writeTo, @addressHex, @data)


  it 'listenIncome', ->
    handler = sinon.spy()
    handlerForAll = sinon.spy()
    data = new Uint8Array(2)
    data[0] = @dataAddrHex
    data[1] = 255

    @i2cSlave.listenIncome(undefined, @dataAddrHex, 2, handler)
    @i2cSlave.listenIncome(undefined, undefined, 2, handlerForAll)

    @listenHanlder(data)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, null, data[1])
    sinon.assert.calledOnce(handlerForAll)
    sinon.assert.calledWith(handlerForAll, null, data)
