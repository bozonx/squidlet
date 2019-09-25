DebounceCall = require('../../../system/lib/DebounceCall').default;


describe.only 'system.lib.DebounceCall', ->
  beforeEach ->
    @id = 'myId'
    @otherId = 'otherId'
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

    # TODO: check that promise1 isn't fulfilled at the moment

    clock.tick(500)

    assert.isFalse(@debounceCall.isInvoking(@id))
    sinon.assert.notCalled(@cb1)
    sinon.assert.calledOnce(@cb2)

    await promise1

    assert.isFulfilled(promise1)

    clock.restore()

  it "invoke two ids", ->
    clock = sinon.useFakeTimers()

    promise1 = @debounceCall.invoke(@cb1, @debounce, @id)

    clock.tick(500)

    promise2 = @debounceCall.invoke(@cb2, @debounce, @otherId)

    clock.tick(500)

    assert.isFalse(@debounceCall.isInvoking(@id))
    assert.isTrue(@debounceCall.isInvoking(@otherId))
    assert.isFulfilled(promise1)

    # TODO: check that promise2 isn't fulfilled at the moment

    clock.tick(500)

    clock.restore()

  it "clear", ->
    clock = sinon.useFakeTimers()

    @debounceCall.invoke(@cb1, @debounce, @id)
    @debounceCall.invoke(@cb2, @debounce, @otherId)
    @debounceCall.clear(@id)

    clock.tick(@debounce)

    sinon.assert.notCalled(@cb1)
    sinon.assert.calledOnce(@cb2)

    clock.restore()

  it "destroy", ->
    clock = sinon.useFakeTimers()

    @debounceCall.invoke(@cb1, @debounce, @id)
    @debounceCall.invoke(@cb2, @debounce, @otherId)
    @debounceCall.destroy(@id)

    clock.tick(@debounce)

    sinon.assert.notCalled(@cb1)
    sinon.assert.notCalled(@cb2)

    clock.restore()

  # TODO: test error case
  # TODO: test stop waiting when added a new cb without a timeout
  # TODO: test immediatelly call without timeout
