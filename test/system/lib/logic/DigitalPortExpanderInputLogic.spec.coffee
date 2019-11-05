DigitalPortExpanderInputLogic = require('../../../../system/lib/logic/DigitalPortExpanderInputLogic').default;
binaryHelpers = require('../../../../system/lib/binaryHelpers');


describe.only 'system.lib.logic.DigitalPortExpanderInputLogic', ->
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

    assert.equal(@state, 3)
    assert.isFalse(@logic.isInProgress())

    sinon.assert.calledOnce(@handler1)
    sinon.assert.calledWith(@handler1, true)

  it "incomeState - update several times without debounce - the event will be called twice", ->
    @logic.onChange(@pin0, @handler1)

    @logic.incomeState(@pin0, true)
    @logic.incomeState(@pin0, false)

    assert.equal(@state, 0)

    sinon.assert.calledTwice(@handler1)
    sinon.assert.calledWith(@handler1, false)

  it "incomeState - update with the same value without debounce - the event will be risen once", ->
    @logic.onChange(@pin0, @handler1)

    @logic.incomeState(@pin0, true)
    @logic.incomeState(@pin0, true)

    assert.equal(@state, 1)

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

    @state = 1

    await @pollPromise

    assert.isFalse(@logic.isInProgress(@pin0))
    assert.isFalse(@logic.isPollInProgress())
    sinon.assert.calledOnce(@handler1)
    sinon.assert.calledWith(@handler1, true)

    clock.restore()
