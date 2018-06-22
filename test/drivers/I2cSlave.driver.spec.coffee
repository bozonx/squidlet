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
    @dataToWrite = new Uint8Array(2)
    @dataToWrite[0] = @dataAddrHex
    @dataToWrite[1] = @data[0]

    @drivers = {
      getDriver: => @i2cSlaveDev
    }

    @i2cSlave = new I2cSlave(@drivers, {}).getInstance(@bus)

  it 'write to dataAddress', ->
    await @i2cSlave.write(undefined , @dataAddrHex, @data)

    sinon.assert.calledWith(@i2cSlaveDevInstance.send,  @dataToWrite)

  it 'write without dataAddress', ->
    await @i2cSlave.write(undefined, undefined, @data)

    sinon.assert.calledWith(@i2cSlaveDevInstance.send,  @data)

  it 'read', ->

  it 'listenIncome', ->
    handler = sinon.spy()
    handlerForAll = sinon.spy()

    @i2cSlave.listenIncome(undefined, @dataAddrHex, 1, handler)
    @i2cSlave.listenIncome(undefined, undefined, 2, handlerForAll)

    @listenHanlder(@dataToWrite)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, null, @data)
    sinon.assert.calledOnce(handlerForAll)
    sinon.assert.calledWith(handlerForAll, null, @dataToWrite)

  it 'listenIncome without data', ->
    handler = sinon.spy()
    handlerForAll = sinon.spy()
    data = new Uint8Array(1)
    data[0] = @dataAddrHex

    @i2cSlave.listenIncome(undefined, @dataAddrHex, 0, handler)
    @i2cSlave.listenIncome(undefined, undefined, 1, handlerForAll)

    @listenHanlder(data)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, null, undefined)
    sinon.assert.calledOnce(handlerForAll)
    sinon.assert.calledWith(handlerForAll, null, data)
