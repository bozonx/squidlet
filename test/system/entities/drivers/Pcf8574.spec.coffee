Pcf8574 = require('../../../../entities/drivers/Pcf8574/Pcf8574').default;
{PinDirection} = require('../../../../system/interfaces/gpioTypes');
IndexedEvents = require('../../../../system/lib/IndexedEvents').default;


describe.only 'entities.drivers.Pcf8574', ->
  beforeEach ->
    @pin0 = 0
    @handler1 = sinon.spy()
    @i2cEvents = new IndexedEvents();
    @i2cToSlave = {
      write: sinon.stub().returns(Promise.resolve())
      pollOnce: sinon.stub().returns(Promise.resolve())
      hasFeedback: () => true
      addPollErrorListener: sinon.spy()
      addListener: (handler) => @i2cEvents.addListener(handler)
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
    assert.equal(@expander.getState(), 0b00000000)
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
    #sinon.assert.calledOnce(@i2cToSlave.addListener)
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
    await @expander.setupInput(2)
    await @expander.setupOutput(3)

    await @expander.writeState(0b11111111)

    assert.equal(@expander.getState(), 0b00001001)
    sinon.assert.notCalled(@i2cToSlave.write)

    await @expander.initIc()

    sinon.assert.calledOnce(@i2cToSlave.write)
    sinon.assert.calledWith(@i2cToSlave.write, undefined, new Uint8Array([0b00001101]))

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

  it "write with buffer - collect write request and make only one write to IC", ->
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

  it "write while IC is initializing", ->
    await @expander.setupOutput(@pin0)

    initPromise = @expander.initIc()

    assert.isFalse(@expander.isIcInitialized())

    writePromise = @expander.write(@pin0, true)

    await initPromise
    await writePromise

    sinon.assert.calledTwice(@i2cToSlave.write)
    sinon.assert.calledWith(@i2cToSlave.write.getCall(0), undefined, new Uint8Array([0b00000000]))
    sinon.assert.calledWith(@i2cToSlave.write.getCall(1), undefined, new Uint8Array([0b00000001]))

  it "pollOnce before or while IC initilized - do nothing", ->
    await @expander.pollOnce()

    sinon.assert.notCalled(@i2cToSlave.pollOnce)

  it "pollOnce after IC initilized - make request and catch events", ->
    await @expander.setupInput(@pin0)
    @expander.onChange(@pin0, @handler1)

    await @expander.initIc()
    await @expander.pollOnce()

    assert.equal(@expander.getState(), 0b00000000)

    @i2cEvents.emit(undefined, new Uint8Array([0b00000001]))

    sinon.assert.calledOnce(@handler1)
    sinon.assert.calledWith(@handler1, true)
    assert.equal(@expander.getState(), 0b00000001)

  it "removeListener", ->
    await @expander.setupInput(@pin0)
    handlerIndex = @expander.onChange(@pin0, @handler1)

    await @expander.initIc()
    await @expander.pollOnce()

    @expander.removeListener(handlerIndex)

    @i2cEvents.emit(undefined, new Uint8Array([0b00000001]))

    sinon.assert.notCalled(@handler1)

  it "read before IC inited - just return false", ->
    await @expander.setupInput(@pin0)

    readPromise = @expander.read(@pin0)

    assert.isFalse(await readPromise)
    assert.equal(@expander.getState(), 0b00000000)

  it "read after IC inited - make poo and return a value", ->
    await @expander.setupInput(@pin0)
    await @expander.initIc()

    readPromise = @expander.read(@pin0)

    @i2cEvents.emit(undefined, new Uint8Array([0b00000001]))

    assert.isTrue(await readPromise)
    assert.equal(@expander.getState(), 0b00000001)
