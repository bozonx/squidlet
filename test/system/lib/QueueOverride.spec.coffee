QueueOverride = require('../../../system/lib/QueueOverride').default;
Promised = require('../../../system/lib/Promised').default;


describe.only 'system.lib.QueueOverride', ->
  beforeEach ->
    #@id = 'myId'
    #@otherId = 'otherId'
    @timeout = 10
    @promised1 = new Promised();
    @promised2 = new Promised();
    @cb1 = sinon.stub().returns(@promised1.promise)
    @cb2 = sinon.stub().returns(@promised2.promise)
    @queue = new QueueOverride(() =>, @timeout)

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


  # TODO: stop
  # TODO: destroy
  # TODO: hasQueue
  # TODO: timeout
  # TODO: error - сбрасывает очередь
  # TODO: несколько раз накидывать очередь
  # TODO: разные id
