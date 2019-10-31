ThrottleCall = require('../../../system/lib/debounceCall/ThrottleCall').default;


describe.only 'system.lib.ThrottleCall', ->
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

    # TODO: не должeн фулфилиться здесь
    assert.isFulfilled(promise1)
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

#  it "invoke - force current debounce", ->
#    clock = sinon.useFakeTimers()
#
#    promise1 = @throttleCall.invoke(@cb1, @debounce, @id)
#    @throttleCall.invoke(@cb2, 0, @id)
#
#    assert.isFalse(@throttleCall.isInvoking(@id))
#    sinon.assert.notCalled(@cb1)
#    sinon.assert.calledOnce(@cb2)
#    assert.isFulfilled(promise1)
#
#    clock.tick(@debounce)
#
#    assert.isFalse(@throttleCall.isInvoking(@id))
#    sinon.assert.notCalled(@cb1)
#    sinon.assert.calledOnce(@cb2)
#
#    clock.restore()
#
#  it "clear", ->
#    clock = sinon.useFakeTimers()
#
#    @throttleCall.invoke(@cb1, @debounce, @id)
#    @throttleCall.invoke(@cb2, @debounce, @otherId)
#    @throttleCall.clear(@id)
#
#    clock.tick(@debounce)
#
#    sinon.assert.notCalled(@cb1)
#    sinon.assert.calledOnce(@cb2)
#
#    clock.restore()
#
#  it "destroy", ->
#    clock = sinon.useFakeTimers()
#
#    @throttleCall.invoke(@cb1, @debounce, @id)
#    @throttleCall.invoke(@cb2, @debounce, @otherId)
#    @throttleCall.destroy(@id)
#
#    clock.tick(@debounce)
#
#    sinon.assert.notCalled(@cb1)
#    sinon.assert.notCalled(@cb2)
#
#    clock.restore()
