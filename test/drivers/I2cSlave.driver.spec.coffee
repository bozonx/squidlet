I2cSlave = require('../../src/drivers/I2cSlave.driver').default


describe 'I2cMaster.driver', ->
  beforeEach ->
    @readResult = new Uint8Array(1)
    @readResult[0] = 10
    @i2cDevInstance = {
      writeTo: sinon.stub().returns(Promise.resolve())
      readFrom: sinon.stub().returns(Promise.resolve(@readResult))
    }
    @i2cDev = getInstance: => @i2cDevInstance
    @bus = 1
    @address = '5a'
    @addressHex = parseInt(@address, 16)
    @dataAddrHex = 0x1a
    @data = new Uint8Array(1)
    @data[0] = 255

    @drivers = {
      getDriver: => @i2cDev
    }

    @i2cSlave = new I2cSlave(@drivers, {}).getInstance(@bus)

  it 'write to dataAddress', ->
    await @i2cMaster.write(@address, @dataAddrHex, @data)

    dataToWrite = new Uint8Array(2)
    dataToWrite[0] = @dataAddrHex
    dataToWrite[1] = @data[0]

    sinon.assert.calledWith(@i2cDevInstance.writeTo, @addressHex, dataToWrite)

  it 'write without dataAddress', ->
    await @i2cMaster.write(@address, undefined, @data)

    sinon.assert.calledWith(@i2cDevInstance.writeTo, @addressHex, @data)
