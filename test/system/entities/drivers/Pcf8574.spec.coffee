Pcf8574 = require('../../../../entities/drivers/Pcf8574/Pcf8574').default;
{PinDirection} = require('../../../../system/interfaces/gpioTypes');


describe.only 'entities.drivers.Pcf8574', ->
  beforeEach ->
    @pin0 = 0
    @i2cToSlave = {
      write: sinon.stub().returns(Promise.resolve())
      hasFeedback: () => true
      addPollErrorListener: sinon.spy()
      addListener: sinon.spy()
      startFeedback: sinon.spy()
    }
    @context = {
      log: {
        error: () =>
      }
      config: {
        config: {
          queueJobTimeoutSec: 1
        }
      }
      getSubDriver: () => @i2cToSlave
      system: {
        envSet: {
          loadManifest: () => Promise.resolve({})
        }
      }
    }
    @definition = {
      id: 'Pcf8574'
      className: 'Pcf8574'
      props: {
        busNum: 1
        address: '5a'
        writeBufferMs: 0
      }
    }
    @driver = new Pcf8574(@context, @definition)
    @expander = await @driver.subDriver({});

    await @expander.init()

  it "setupInput", ->
    await @expander.setupInput(@pin0)

    assert.equal(@expander.getPinDirection(@pin0), PinDirection.input)
    # input pins are marked as high level
    assert.equal(@expander.getState(), 0b00000001)
    assert.isTrue(@expander.hasInputPins())
    assert.isFalse(@expander.isIcInitialized())

  it "setupInput - don't allow resetup, only after clear pin", ->
    await @expander.setupInput(@pin0)

    assert.isRejected(@expander.setupOutput(@pin0))
    assert.isRejected(@expander.setupInput(@pin0))

    @expander.clearPin(@pin0)

    assert.isUndefined(@expander.getPinDirection(@pin0))

    await @expander.setupInput(@pin0)

    assert.equal(@expander.getPinDirection(@pin0), PinDirection.input)

  it "setupOutput", ->
    await  @expander.setupOutput(@pin0, true)

    assert.equal(@expander.getPinDirection(@pin0), PinDirection.output)
    assert.isTrue(@expander.getPinState(@pin0))
    # initial value of pin 0 = true
    assert.equal(@expander.getState(), 0b00000001)
    assert.isFalse(@expander.hasInputPins())
    assert.isFalse(@expander.isIcInitialized())

  it "setupOutput - don't allow resetup, only after clear pin", ->
    await @expander.setupOutput(@pin0)

    assert.isRejected(@expander.setupOutput(@pin0))
    assert.isRejected(@expander.setupInput(@pin0))

    @expander.clearPin(@pin0)

    assert.isUndefined(@expander.getPinDirection(@pin0))

    await @expander.setupOutput(@pin0, true)

    assert.equal(@expander.getPinDirection(@pin0), PinDirection.output)

  it "initIc", ->
    await @expander.setupInput(@pin0)
    await @expander.setupOutput(1, true)

    assert.isTrue(@expander.setupStep)
    assert.isFalse(@expander.initIcStep)
    assert.isFalse(@expander.isIcInitialized())

    promise = @expander.initIc()

    assert.isFalse(@expander.setupStep)
    assert.isTrue(@expander.initIcStep)
    assert.isFalse(@expander.isIcInitialized())
    assert.isFalse(@expander.initIcPromised.isResolved())

    sinon.assert.calledOnce(@i2cToSlave.write)
    sinon.assert.calledWith(@i2cToSlave.write, undefined, new Uint8Array([0b00000011]))

    await promise

    assert.isFalse(@expander.setupStep)
    assert.isFalse(@expander.initIcStep)
    assert.isTrue(@expander.isIcInitialized())
    assert.isTrue(@expander.initIcPromised.isResolved())

    sinon.assert.calledOnce(@i2cToSlave.addPollErrorListener)
    sinon.assert.calledOnce(@i2cToSlave.addListener)
    sinon.assert.calledOnce(@i2cToSlave.startFeedback)

  it "write before initIc", ->
    await @expander.setupOutput(@pin0)

    assert.equal(@expander.getState(), 0b00000000)

    await @expander.write(@pin0, true)

    assert.equal(@expander.getState(), 0b00000001)
    sinon.assert.notCalled(@i2cToSlave.write)

    await @expander.initIc()

    sinon.assert.calledOnce(@i2cToSlave.write)
    sinon.assert.calledWith(@i2cToSlave.write, undefined, new Uint8Array([0b00000001]))

  it "writeState before initIc", ->
    await @expander.setupOutput(@pin0)
    await @expander.setupInput(3)

    await @expander.writeState(0b11111111)

    assert.equal(@expander.getState(), 0b00001001)
    sinon.assert.notCalled(@i2cToSlave.write)

    await @expander.initIc()

    sinon.assert.calledOnce(@i2cToSlave.write)
    sinon.assert.calledWith(@i2cToSlave.write, undefined, new Uint8Array([0b00001001]))

  it "write after initIc", ->
    await @expander.setupOutput(@pin0)
    await @expander.initIc()

    promise = @expander.write(@pin0, true)

    assert.equal(@expander.getState(), 0b00000000)

    await promise

    assert.equal(@expander.getState(), 0b00000001)

    sinon.assert.calledTwice(@i2cToSlave.write)
    sinon.assert.calledWith(@i2cToSlave.write.getCall(0), undefined, new Uint8Array([0b00000000]))
    sinon.assert.calledWith(@i2cToSlave.write.getCall(1), undefined, new Uint8Array([0b00000001]))

  it "writeState after initIc", ->
    await @expander.setupOutput(@pin0)
    await @expander.initIc()

    promise = @expander.writeState(0b00000001)

    assert.equal(@expander.getState(), 0b00000000)

    await promise

    assert.equal(@expander.getState(), 0b00000001)

    sinon.assert.calledTwice(@i2cToSlave.write)
    sinon.assert.calledWith(@i2cToSlave.write.getCall(0), undefined, new Uint8Array([0b00000000]))
    sinon.assert.calledWith(@i2cToSlave.write.getCall(1), undefined, new Uint8Array([0b00000001]))

  it "write - disallow write to pin which hasn't been setup", ->
    assert.isRejected(@expander.write(@pin0, true))

  it "write with buffer", ->
    @expander._expanderOutput.writeBufferMs = 1

    await @expander.setupOutput(@pin0)
    await @expander.setupOutput(1)
    await @expander.initIc()

    @expander.write(@pin0, true)
    promise2 = @expander.write(1, true)

    await promise2

    sinon.assert.calledTwice(@i2cToSlave.write)
    sinon.assert.calledWith(@i2cToSlave.write.getCall(0), undefined, new Uint8Array([0b00000000]))
    sinon.assert.calledWith(@i2cToSlave.write.getCall(1), undefined, new Uint8Array([0b00000011]))

