I2cNode = require('../../../../entities/drivers/I2cToSlave/I2cToSlave').default


describe 'I2cNode.driver', ->
  beforeEach ->
#    @readResult = new Uint8Array(1)
#    @readResult[0] = 10
#    @i2cDevInstance = {
#      writeTo: sinon.stub().returns(Promise.resolve())
#      readFrom: sinon.stub().returns(Promise.resolve(@readResult))
#    }
#    @i2cDev = getInstance: => @i2cDevInstance
#    @bus = 1
#    @address = '5a'
#    @addressHex = parseInt(@address, 16)
#    @dataAddrHex = 0x1a
#    @data = new Uint8Array(1)
#    @data[0] = 255
#
#    @drivers = {
#      getDriver: => @i2cDev
#    }

    @props = {
      bus: 1
      address: '5a'
      ints: {
        '6a': {
          impulseLength: 300,
        }
      }
    }

    @defintion = {
      id: 'I2cNode.driver'
      className: 'I2cNode.driver'
    }

    @env = {

    }

    @instantiate = =>
      @driver = await (new I2cNode(@defintion, @env)).getInstance(@props)

  it 'init', ->
    await @instantiate()

  # TODO: test inpulse with invert

#  it 'poll to dataAddress and listenIncome', ->
#    handler = sinon.spy()
#    @i2cMaster.startListen = sinon.spy()
#    @i2cMaster.listenIncome(@address, @dataAddrHex, 1, handler)
#
#    await @i2cMaster.poll(@address, @dataAddrHex, 1)
#    await @i2cMaster.poll(@address, @dataAddrHex, 1)
#
#    sinon.assert.calledWith(@i2cMaster.startListen, @addressHex, @dataAddrHex, 1)
#    sinon.assert.calledOnce(handler)
#    sinon.assert.calledWith(handler, null, @readResult)
#
#  it 'poll and listenIncome without dataAddress', ->
#    handler = sinon.spy()
#    @i2cMaster.startListen = sinon.spy()
#    @i2cMaster.listenIncome(@address, undefined, 1, handler)
#
#    await @i2cMaster.poll(@address, undefined, 1)
#
#    sinon.assert.calledWith(@i2cMaster.startListen, @addressHex, undefined, 1)
#    sinon.assert.calledWith(handler, null, @readResult)
#
#  it 'request to dataAddress', ->
#    @i2cMaster.write = sinon.stub().returns(Promise.resolve())
#    @i2cMaster.read = sinon.stub().returns(Promise.resolve(@readResult))
#
#    await @i2cMaster.request(@address, @dataAddrHex, @data, 1)
#
#    sinon.assert.calledWith(@i2cMaster.write, @addressHex, @dataAddrHex, @data)
#    sinon.assert.calledWith(@i2cMaster.read, @addressHex, @dataAddrHex, 1)
#
#  it 'request without dataAddress', ->
#    @i2cMaster.write = sinon.stub().returns(Promise.resolve())
#    @i2cMaster.read = sinon.stub().returns(Promise.resolve(@readResult))
#
#    await @i2cMaster.request(@address, undefined, @data, 1)
#
#    sinon.assert.calledWith(@i2cMaster.write, @addressHex, undefined, @data)
#    sinon.assert.calledWith(@i2cMaster.read, @addressHex, undefined, 1)
#
#  it 'read from dataAddress', ->
#    @i2cMaster.writeEmpty = sinon.stub().returns(Promise.resolve())
#
#    await @i2cMaster.read(@address, @dataAddrHex, 1)
#
#    sinon.assert.calledWith(@i2cMaster.writeEmpty, @addressHex, @dataAddrHex)
#    sinon.assert.calledWith(@i2cDevInstance.readFrom, @addressHex, 1)
#
#  it 'read without dataAddress', ->
#    @i2cMaster.writeEmpty = sinon.stub().returns(Promise.resolve())
#
#    await @i2cMaster.read(@address, undefined , 1)
#
#    sinon.assert.notCalled(@i2cMaster.writeEmpty)
#    sinon.assert.calledWith(@i2cDevInstance.readFrom, @addressHex, 1)
#
#  it 'write to dataAddress', ->
#    await @i2cMaster.write(@address, @dataAddrHex, @data)
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
#
#  it 'writeEmpty', ->
#    await @i2cMaster.writeEmpty(@address, @dataAddrHex)
#
#    dataToWrite = new Uint8Array(1)
#    dataToWrite[0] = @dataAddrHex
#
#    sinon.assert.calledWith(@i2cDevInstance.writeTo, @addressHex, dataToWrite)
