I2cMaster = require('../../src/drivers/I2cMaster.driver').default
#helpers = require('../../src/helpers/helpers')


describe.only 'I2cMaster.driver', ->
  beforeEach ->
    @i2cDevInstance = {
      writeTo: sinon.stub().returns(Promise.resolve())
#      listen: (register, length, handler) => @listenHandler = handler
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

    @i2cMaster = new I2cMaster(@drivers, {}).getInstance(@bus)

  it 'write to dataAddress', ->
    await @i2cMaster.write(@address, @dataAddrHex, @data)

    dataToWrite = new Uint8Array(2)
    dataToWrite[0] = @dataAddrHex
    dataToWrite[1] = @data[0]

    sinon.assert.calledWith(@i2cDevInstance.writeTo, @addressHex, dataToWrite)

  it 'write without dataAddress', ->
