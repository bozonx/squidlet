DigitalPortExpanderInputLogic = require('../../../system/lib/logic/DigitalPortExpanderInputLogic').default;


describe.only 'system.lib.logic.DigitalPortExpanderInputLogic', ->
  beforeEach ->
    @state = {}
    @handler1 = sinon.spy()
    @pin0 = 0
    @pollOnce = () =>
    @getState = () => @state
    @updateState = (pin, value) => @state[pin] = value
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

    assert.deepEqual(@state, {
      0: true,
      1: false,
    })

    sinon.assert.calledOnce(@handler1)
