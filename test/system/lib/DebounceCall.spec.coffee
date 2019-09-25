DebounceCall = require('../../../system/lib/DebounceCall').default;


describe.only 'system.lib.DebounceCall', ->
  beforeEach ->
    @id = 'myId'
    @debounce = 1000
    @cb1 = sinon.spy()
    @cb2 = sinon.spy()
    @debounceCall = new DebounceCall()

  it "invoke with debounce", ->
    clock = sinon.useFakeTimers()

    assert.isFalse(@debounceCall.isInvoking(@id))

    promise1 = @debounceCall.invoke(@cb1, @debounce, @id)

    assert.isTrue(@debounceCall.isInvoking(@id))

    clock.tick(500)

    promise2 = @debounceCall.invoke(@cb2, @debounce, @id)
    assert.isTrue(@debounceCall.isInvoking(@id))

    assert.equal(promise1, promise2)

    clock.tick(500)

    assert.isTrue(@debounceCall.isInvoking(@id))
    sinon.assert.notCalled(@cb1)
    sinon.assert.notCalled(@cb2)

    clock.tick(500)

    assert.isFalse(@debounceCall.isInvoking(@id))
    sinon.assert.notCalled(@cb1)
    sinon.assert.calledOnce(@cb2)
    assert.isFulfilled(promise1)

    clock.restore()

  it "clear", ->
    clock = sinon.useFakeTimers()

    @debounceCall.invoke(@cb1, 1000, @id)
    @debounceCall.clear(@id)

    clock.tick(1000)

    sinon.assert.notCalled(@cb1)

    clock.restore()

  # TODO: test error case
  # TODO: test destroy
  # TODO: test stop waiting when added a new cb without a timeout
  # TODO: test что таймауты с разными id не мешают друг другу
  # TODO: test immediatelly call without timeout
