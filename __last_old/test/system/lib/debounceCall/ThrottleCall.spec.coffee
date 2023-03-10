ThrottleCall = require('../../../../system/lib/debounceCall/ThrottleCall').default;


describe 'system.lib.ThrottleCall', ->
  beforeEach ->
    @id = 'myId'
    @otherId = 'otherId'
    @debounce = 1000
    @cb1 = sinon.spy()
    @cb2 = sinon.spy()
    @throttleCall = new ThrottleCall()

  it "invoke with debounce", ->
    clock = sinon.useFakeTimers()

    assert.isFalse(@throttleCall.isInvoking(@id))

    promise1 = @throttleCall.invoke(@cb1, @debounce, @id)

    assert.isTrue(@throttleCall.isInvoking(@id))
    sinon.assert.calledOnce(@cb1)

    clock.tick(500)

    promise2 = @throttleCall.invoke(@cb2, @debounce, @id)
    assert.isTrue(@throttleCall.isInvoking(@id))

    assert.equal(promise1, promise2)

    clock.tick(500)

    assert.isFalse(@throttleCall.isInvoking(@id))
    sinon.assert.notCalled(@cb2)

    await promise1

    assert.isFulfilled(promise1)

    clock.restore()

  it "invoke two ids", ->
    clock = sinon.useFakeTimers()

    promise1 = @throttleCall.invoke(@cb1, @debounce, @id)

    clock.tick(500)

    promise2 = @throttleCall.invoke(@cb2, @debounce, @otherId)

    clock.tick(500)

    assert.isFalse(@throttleCall.isInvoking(@id))
    assert.isTrue(@throttleCall.isInvoking(@otherId))
    assert.isFulfilled(promise1)

    clock.tick(500)

    assert.isFulfilled(promise2)

    clock.restore()

  it "invoke with error case - just fulfil on error", ->
    clock = sinon.useFakeTimers()
    promise1 = @throttleCall.invoke(
      () =>
        throw new Error('err')
      ,
      @debounce,
      @id
    )

    assert.isTrue(@throttleCall.isInvoking(@id))

    clock.tick(@debounce)

    assert.isFulfilled(promise1)
    assert.isFalse(@throttleCall.isInvoking(@id))

    clock.restore()

  it "invoke - call cb immediately", ->
    promise1 = @throttleCall.invoke(@cb1, 0, @id)

    assert.isFulfilled(promise1)
    assert.isFalse(@throttleCall.isInvoking(@id))
    sinon.assert.calledOnce(@cb1)

  it "invoke - force current debounce", ->
    promise1 = @throttleCall.invoke(@cb1, @debounce, @id)
    @throttleCall.invoke(@cb2, 0, @id)

    assert.isFalse(@throttleCall.isInvoking(@id))
    sinon.assert.calledOnce(@cb1)
    sinon.assert.calledOnce(@cb2)
    assert.isFulfilled(promise1)

  it "clear", ->
    @throttleCall.invoke(@cb1, @debounce, @id)
    @throttleCall.clear(@id)

    assert.isFalse(@throttleCall.isInvoking(@id))

  it "destroy", ->
    @throttleCall.invoke(@cb1, @debounce, @id)
    @throttleCall.destroy(@id)

    assert.isFalse(@throttleCall.isInvoking(@id))
