DebounceCall = require('../../../system/lib/DebounceCall').default;


describe.only 'system.lib.DebounceCall', ->
  beforeEach ->
    @id = 'myId'
    @cb1 = sinon.spy()
    @cb2 = sinon.spy()
    @debounceCall = new DebounceCall()

  it "invoke", ->
    clock = sinon.useFakeTimers()

    promise1 = @debounceCall.invoke(@cb1, 1000, @id)
    promise2 = @debounceCall.invoke(@cb2, 1000, @id)

    clock.tick(1000)

    sinon.assert.notCalled(@cb1)
    sinon.assert.calledOnce(@cb2)
    assert.isFulfilled(promise1)
    assert.isFulfilled(promise2)

    clock.restore()

  it "clear", ->
    clock = sinon.useFakeTimers()

    @debounceCall.invoke(@cb1, 1000, @id)
    @debounceCall.clear(@id)

    clock.tick(1000)

    sinon.assert.notCalled(@cb1)

    clock.restore()
