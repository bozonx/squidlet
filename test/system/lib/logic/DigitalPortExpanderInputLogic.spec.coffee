DigitalPortExpanderInputLogic = require('../../../../system/lib/logic/DigitalPortExpanderInputLogic').default;
binaryHelpers = require('../../../../system/lib/binaryHelpers');


describe.only 'system.lib.logic.DigitalPortExpanderInputLogic', ->
  beforeEach ->
    @state = 0
    @handler1 = sinon.spy()
    @pin0 = 0
    @pollOnce = () =>
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

  it "incomeState - update several times without debounce - the event will be called twice", ->
    @logic.onChange(@pin0, @handler1)

    @logic.incomeState(@pin0, true)
    @logic.incomeState(@pin0, false)

    assert.equal(@state, 0)

    sinon.assert.calledTwice(@handler1)

  it "incomeState - update with the same value without debounce - the event will be risen once", ->
    @logic.onChange(@pin0, @handler1)

    @logic.incomeState(@pin0, true)
    @logic.incomeState(@pin0, true)

    assert.equal(@state, 1)

    sinon.assert.calledOnce(@handler1)

  it "incomeState - with debounce", ->
    @logic.onChange(@pin0, @handler1)

    @logic.incomeState(@pin0, true)
