DigitalPortExpanderOutputLogic = require('../../../../system/lib/logic/DigitalPortExpanderOutputLogic').default;


describe.only 'system.lib.logic.DigitalPortExpanderOutputLogic', ->
  beforeEach ->
    @pin0 = 0
    @state = 0
    @writeCb = sinon.stub().returns(Promise.resolve())
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
    sinon.assert.calledWith(@writeCb, 1)
