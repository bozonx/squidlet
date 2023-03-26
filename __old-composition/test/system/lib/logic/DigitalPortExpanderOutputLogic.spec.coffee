DigitalPortExpanderOutputLogic = require('../../../../system/lib/logic/DigitalExpanderOutputLogic').default;


describe 'system.lib.logic.DigitalExpanderOutputLogic', ->
  beforeEach ->
    @pin0 = 0
    @state = 0
    @writePromise = Promise.resolve()
    @writeCb = sinon.stub().returns(@writePromise)
    @getState = () => @state
    @setState = (newState) => @state = newState
    @queueJobTimeoutSec = 1
    @writeBufferMs = 100
    @logic = new DigitalPortExpanderOutputLogic(
      () =>,
      @writeCb,
      @getState,
      @setState,
      @queueJobTimeoutSec,
      @writeBufferMs,
    )

  it "write - simple without write buffer", ->
    @logic.writeBufferMs = 0

    promise = @logic.write(@pin0, true)

    assert.isTrue(@logic.isInProgress())
    assert.isTrue(@logic.isWriting())

    await promise

    assert.isFalse(@logic.isInProgress())
    assert.isFalse(@logic.isWriting())
    sinon.assert.calledOnce(@writeCb)
    sinon.assert.calledWith(@writeCb, 0b00000001)
    assert.equal(@state, 0b00000001)

  it "write buffer - write only the last value", ->
    clock = sinon.useFakeTimers()

    promise1 = @logic.write(@pin0, true)
    promise2 = @logic.write(@pin0, false)
    @logic.write(1, true)

    assert.isTrue(@logic.isInProgress())
    assert.isTrue(@logic.isBuffering())
    assert.isFalse(@logic.isWriting())
    assert.isTrue(promise1 == promise2)

    clock.tick(@writeBufferMs)

    assert.isTrue(@logic.isInProgress())
    assert.isFalse(@logic.isBuffering())
    assert.isTrue(@logic.isWriting())
    sinon.assert.calledOnce(@writeCb)
    sinon.assert.calledWith(@writeCb, 0b00000010)

    await @writePromise

    assert.equal(@state, 0b00000010)

    clock.restore()

  it "cancel buffer", ->
    clock = sinon.useFakeTimers()

    @logic.write(@pin0, true)
    @logic.write(@pin0, false)

    assert.isTrue(@logic.isBuffering())

    @logic.cancel();

    assert.isFalse(@logic.isBuffering())
    assert.isFalse(@logic.isInProgress())
    assert.isFalse(@logic.isWriting())

    clock.tick(@writeBufferMs)

    sinon.assert.notCalled(@writeCb)

    await @writePromise

    assert.equal(@state, 0b00000000)

    clock.restore()

  it "write - add new request while writing - start new write after current is finished", ->
    @logic.writeBufferMs = 0

    @logic.write(@pin0, false)

    assert.isTrue(@logic.isWriting())

    sinon.assert.calledOnce(@writeCb)

    promise2 = @logic.write(@pin0, true)

    sinon.assert.calledOnce(@writeCb)

    await @writePromise

    assert.isTrue(@logic.isWriting())
    sinon.assert.calledTwice(@writeCb)
    sinon.assert.calledWith(@writeCb.getCall(0), 0b00000000)
    sinon.assert.calledWith(@writeCb.getCall(1), 0b00000001)
    assert.equal(@state, 0b00000000)

    await promise2

    assert.equal(@state, 0b00000001)
    assert.isUndefined(@logic.writingTimeBuffer)

  it "cancel writing - it will resolve promise", ->
    @logic.writeBufferMs = 0

    promise = @logic.write(@pin0, true)

    assert.isTrue(@logic.isWriting())

    @logic.cancel()

    assert.isFalse(@logic.isWriting())

    await promise

    sinon.assert.calledOnce(@writeCb)
    assert.equal(@state, 0b00000001)

  it "cancel rewriting", ->
    @logic.writeBufferMs = 0

    @logic.write(@pin0, false)

    assert.isTrue(@logic.isWriting())

    promise2 = @logic.write(@pin0, true)

    @logic.cancel()

    assert.isFalse(@logic.isWriting())

    await promise2

    sinon.assert.calledOnce(@writeCb)
    assert.equal(@state, 0b00000000)

  it "writeState - simple write", ->
    promise = @logic.writeState(0b00110011)

    assert.isTrue(@logic.isInProgress())
    assert.isTrue(@logic.isWriting())

    await promise

    assert.isFalse(@logic.isInProgress())
    assert.isFalse(@logic.isWriting())
    sinon.assert.calledOnce(@writeCb)
    sinon.assert.calledWith(@writeCb, 0b00110011)
    assert.equal(@state, 0b00110011)

  it "writeState - buffering", ->
    @logic.write(@pin0, true)
    @logic.write(1, true)

    promise = @logic.writeState(0b00110000)

    assert.isFalse(@logic.isBuffering())
    assert.isTrue(@logic.isInProgress())
    assert.isTrue(@logic.isWriting())

    await promise

    assert.isFalse(@logic.isInProgress())
    assert.isFalse(@logic.isWriting())
    sinon.assert.calledOnce(@writeCb)
    sinon.assert.calledWith(@writeCb, 0b00110000)
    assert.equal(@state, 0b00110000)

  it "writeState - rewrite", ->
    @logic.writeState(0b00000001)

    assert.isTrue(@logic.isWriting())

    sinon.assert.calledOnce(@writeCb)

    promise2 = @logic.writeState(0b00000010)

    sinon.assert.calledOnce(@writeCb)

    await @writePromise

    assert.isTrue(@logic.isWriting())
    sinon.assert.calledTwice(@writeCb)
    sinon.assert.calledWith(@writeCb.getCall(0), 0b00000001)
    sinon.assert.calledWith(@writeCb.getCall(1), 0b00000010)
    assert.equal(@state, 0b00000001)

    await promise2

    assert.equal(@state, 0b00000010)

  it "error while writing", ->
    writeErrPromise = Promise.reject('e');
    @logic.writeCb = sinon.stub().returns(writeErrPromise)
    promise = @logic.writeState(0b00000001)

    assert.isTrue(@logic.isWriting())

    sinon.assert.calledOnce(@logic.writeCb)
    sinon.assert.calledWith(@logic.writeCb, 0b00000001)

    try
      await promise

    assert.isRejected(promise)
    assert.isFalse(@logic.isWriting())
    assert.equal(@state, 0b00000000)

  it "destroy", ->
    @logic.writeState(0b00000001)

    @logic.destroy()

    assert.isTrue(@logic.queue.isDestroyed)
    assert.isTrue(@logic.debounce.isDestroyed)
