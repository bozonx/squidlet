QueueOverride = require('../../../system/lib/QueueOverride').default;
Promised = require('../../../system/lib/Promised').default;


describe 'system.lib.QueueOverride', ->
  beforeEach ->
    @timeout = 1
    @promised1 = new Promised();
    @promised2 = new Promised();
    @promised3 = new Promised();
    @cb1 = sinon.stub().returns(@promised1.promise)
    @cb2 = sinon.stub().returns(@promised2.promise)
    @cb3 = sinon.stub().returns(@promised3.promise)
    @queue = new QueueOverride(@timeout)

  it "add - simple", ->
    assert.isFalse(@queue.isPending())

    promise = @queue.add(@cb1)

    sinon.assert.calledOnce(@cb1)
    assert.isTrue(@queue.isPending())

    @promised1.resolve()

    await promise

    assert.isFulfilled(promise)
    assert.isFalse(@queue.isPending())

  it "add - simple queue", ->
    promise1 = @queue.add(@cb1)
    promise2 = @queue.add(@cb2)

    assert.isFalse(promise1 == promise2)

    assert.isTrue(@queue.hasQueue())
    sinon.assert.calledOnce(@cb1)
    sinon.assert.notCalled(@cb2)

    @promised1.resolve()
    await promise1

    sinon.assert.calledOnce(@cb2)
    assert.isTrue(@queue.isPending())
    assert.isFalse(@queue.hasQueue())
    assert.isFulfilled(promise1)

    @promised2.resolve()
    await promise2

    assert.isFalse(@queue.isPending())
    assert.isFalse(@queue.hasQueue())
    assert.isFulfilled(promise2)

  it "add - queue override", ->
    promise1 = @queue.add(@cb1)
    promise2 = @queue.add(@cb2)
    promise3 = @queue.add(@cb3)

    sinon.assert.calledOnce(@cb1)
    sinon.assert.notCalled(@cb2)
    sinon.assert.notCalled(@cb3)

    @promised1.resolve()
    await promise1

    sinon.assert.notCalled(@cb2)
    sinon.assert.calledOnce(@cb3)

    @promised3.resolve()
    await promise3

    sinon.assert.notCalled(@cb2)

  it "add - queue override after queue started", ->
    promise1 = @queue.add(@cb1)
    promise2 = @queue.add(@cb2)

    @promised1.resolve()
    await promise1

    sinon.assert.calledOnce(@cb2)

    promise3 = @queue.add(@cb3)

    assert.isTrue(@queue.hasQueue())

    @promised2.resolve()
    await promise2

    assert.isFalse(@queue.hasQueue())
    sinon.assert.calledOnce(@cb3)

    @promised3.resolve()
    await promise3

    assert.isFalse(@queue.hasQueue())

  it "add - stop on error", ->
    promise1 = @queue.add(@cb1)
    promise2 = @queue.add(@cb2)

    sinon.assert.calledOnce(@cb1)
    sinon.assert.notCalled(@cb2)

    # handle error on finish promised
    promise2.catch((e) =>)

    @promised1.reject('e')

    try
      await promise1
    catch e

    assert.isFalse(@queue.isPending())
    assert.isFalse(@queue.hasQueue())
    sinon.assert.notCalled(@cb2)

  it "stop", ->
    promise1 = @queue.add(@cb1)
    promise2 = @queue.add(@cb2)

    sinon.assert.calledOnce(@cb1)
    sinon.assert.notCalled(@cb2)

    @queue.stop()

    await promise1

    assert.isFalse(@queue.isPending())
    assert.isFalse(@queue.hasQueue())
    sinon.assert.notCalled(@cb2)

  it "different id", ->
    promise1 = @queue.add(@cb1, 1)
    promise2 = @queue.add(@cb2, 2)

    assert.isTrue(@queue.isPending(1))
    assert.isTrue(@queue.isPending(2))

    sinon.assert.calledOnce(@cb1)
    sinon.assert.calledOnce(@cb2)

    @promised1.resolve()
    @promised2.resolve()

    await promise1
    await promise2

    assert.isFalse(@queue.isPending(1))
    assert.isFalse(@queue.isPending(2))

  it "timeout - clear queue", ->
    clock = sinon.useFakeTimers()

    promise1 = @queue.add(@cb1)
    promise2 = @queue.add(@cb2)

    sinon.assert.calledOnce(@cb1)
    sinon.assert.notCalled(@cb2)

    clock.tick(@timeout * 1000)

    try
      await promise1

    assert.isFalse(@queue.isPending())
    assert.isRejected(promise2)

    clock.restore()

  it "destroy", ->
    @queue.add(@cb1)
    @queue.add(@cb2)

    @queue.destroy()

    assert.isFalse(@queue.isPending())
    assert.isFalse(@queue.hasQueue())
