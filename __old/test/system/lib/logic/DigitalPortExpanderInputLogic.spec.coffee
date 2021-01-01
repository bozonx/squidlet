DigitalPortExpanderInputLogic = require('../../../../system/lib/logic/DigitalExpanderInputLogic').default;
binaryHelpers = require('../../../../../../squidlet-lib/src/binaryHelpers');


describe 'system.lib.logic.DigitalExpanderInputLogic', ->
  beforeEach ->
    @state = 0
    @handler1 = sinon.spy()
    @pin0 = 0
    @debounceMs = 1000
    @pollPromise = Promise.resolve()
    @pollOnce = () => @pollPromise
    @getState = () => @state
    @updateState = (pin, value) => @state = binaryHelpers.updateBitInByte(@state, pin, value)
    @logic = new DigitalPortExpanderInputLogic(
      () =>,
      @pollOnce,
      @getState,
      @updateState
    )

  it "incomeState - without debounce", ->
    @logic.onChange(@pin0, @handler1)

    @logic.incomeState(@pin0, true)
    @logic.incomeState(1, true)

    assert.equal(@state, 0b00000011)
    assert.isFalse(@logic.isInProgress())

    sinon.assert.calledOnce(@handler1)
    sinon.assert.calledWith(@handler1, true)

  it "incomeState - update several times without debounce - the event will be called twice", ->
    @logic.onChange(@pin0, @handler1)

    @logic.incomeState(@pin0, true)
    @logic.incomeState(@pin0, false)

    assert.equal(@state, 0b00000000)

    sinon.assert.calledTwice(@handler1)
    sinon.assert.calledWith(@handler1, false)

  it "incomeState - update with the same value without debounce - the event will be risen once", ->
    @logic.onChange(@pin0, @handler1)

    @logic.incomeState(@pin0, true)
    @logic.incomeState(@pin0, true)

    assert.equal(@state, 0b00000001)

    sinon.assert.calledOnce(@handler1)
    sinon.assert.calledWith(@handler1, true)

  it "incomeState - with debounce and poll", ->
    clock = sinon.useFakeTimers()

    @logic.onChange(@pin0, @handler1)
    @logic.incomeState(@pin0, true, @debounceMs)
    @logic.incomeState(@pin0, false, @debounceMs)

    sinon.assert.notCalled(@handler1)
    assert.isTrue(@logic.isInProgress(@pin0))
    assert.isFalse(@logic.isPollInProgress())

    clock.tick(@debounceMs)

    assert.isTrue(@logic.isInProgress(@pin0))
    assert.isTrue(@logic.isPollInProgress())
    # income state after polling
    @logic.incomeState(@pin0, true, @debounceMs)
    @logic.incomeState(1, true, @debounceMs)

    await @pollPromise

    assert.isFalse(@logic.isInProgress(@pin0))
    assert.isFalse(@logic.isPollInProgress())
    sinon.assert.calledOnce(@handler1)
    sinon.assert.calledWith(@handler1, true)
    assert.equal(@state, 0b00000011)

    clock.restore()

  it "error while poling", ->
    clock = sinon.useFakeTimers()

    @pollPromise = Promise.reject('e')
    @getState = sinon.spy();

    @logic.onChange(@pin0, @handler1)
    @logic.incomeState(@pin0, true, @debounceMs)

    assert.isTrue(@logic.isInProgress(@pin0))
    assert.isFalse(@logic.isPollInProgress())

    clock.tick(@debounceMs)

    try
      await @pollPromise

    assert.isFalse(@logic.isInProgress(@pin0))
    assert.isFalse(@logic.isPollInProgress())

    sinon.assert.notCalled(@handler1)
    sinon.assert.notCalled(@getState)

    clock.restore()

  it "clear debounce", ->
    @logic.onChange(@pin0, @handler1)

    @logic.incomeState(@pin0, true, @debounceMs)
    @logic.incomeState(@pin0, true)

    sinon.assert.calledOnce(@handler1)
    sinon.assert.calledWith(@handler1, true)

  it "clear debounce", ->
    @logic.incomeState(@pin0, true, @debounceMs)

    @logic.cancel()

    assert.isFalse(@logic.isInProgress(@pin0))

  it "clear poll", ->
    clock = sinon.useFakeTimers()
    @getState = sinon.spy();

    @logic.incomeState(@pin0, true, @debounceMs)

    clock.tick(@debounceMs)

    @logic.cancel()
    await @pollPromise

    sinon.assert.notCalled(@getState)

    clock.restore()

  it "clearPin - check debounce", ->
    @logic.incomeState(@pin0, true, @debounceMs)

    @logic.clearPin(@pin0)

    assert.isFalse(@logic.isInProgress(@pin0))
    assert.isFalse(@logic.isPollInProgress())

  it "clearPin - check events", ->
    @logic.onChange(@pin0, @handler1)

    @logic.clearPin(@pin0)

    @logic.incomeState(@pin0, true)

    sinon.assert.notCalled(@handler1)

  it "destroy - check events", ->
    @logic.incomeState(@pin0, true, @debounceMs)

    @logic.destroy()

    assert.isTrue(@logic.events.isDestroyed)
    assert.isTrue(@logic.debounce.isDestroyed)
    assert.isUndefined(@logic.pollPromise)
    assert.isUndefined(@logic.polledPinsBuffer)

  it "removeListener", ->
    handlerIndex = @logic.onChange(@pin0, @handler1)
    @logic.removeListener(handlerIndex)

    @logic.incomeState(@pin0, true)

    sinon.assert.notCalled(@handler1)
