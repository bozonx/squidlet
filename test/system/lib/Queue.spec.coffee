Queue = require('../../../system/lib/Queue').default;
Promised = require('../../../system/lib/Promised').default;


describe 'system.lib.Queue', ->
  beforeEach ->
    @jobId1 = 'jobId1'
    @jobId2 = 'jobId2'
    @cb1 = sinon.stub().returns(Promise.resolve())
    @cb2 = sinon.stub().returns(Promise.resolve())
    @queue = new Queue()

  it "ordinary queue with jobs with different id. Check queue states", ->
    resolvedJobId1 = @queue.add(@cb1, @jobId1)
    @queue.add(@cb2, @jobId2)

    assert.equal(resolvedJobId1, @jobId1)
    assert.equal(@queue.getQueueLength(), 1)
    assert.deepEqual(@queue.getJobIds(), [@jobId1, @jobId2])
    assert.isTrue(@queue.isJobInProgress(@jobId1))
    assert.isTrue(@queue.isInProgress())
    assert.equal(@queue.getCurrentJobId(), @jobId1)
    assert.isTrue(@queue.hasJob(@jobId1))
    assert.isTrue(@queue.hasJob(@jobId2))

    sinon.assert.calledOnce(@cb1)
    sinon.assert.notCalled(@cb2)

    await @queue.waitCurrentJobFinished()

    assert.equal(@queue.getQueueLength(), 0)
    assert.deepEqual(@queue.getJobIds(), [@jobId2])
    assert.isFalse(@queue.isJobInProgress(@jobId1))
    assert.isTrue(@queue.isJobInProgress(@jobId2))
    assert.isTrue(@queue.isInProgress())
    assert.equal(@queue.getCurrentJobId(), @jobId2)
    assert.isFalse(@queue.hasJob(@jobId1))
    assert.isTrue(@queue.hasJob(@jobId2))

    await @queue.waitJobFinished(@jobId2)

    sinon.assert.calledOnce(@cb1)
    sinon.assert.calledOnce(@cb2)
    assert.equal(@queue.getQueueLength(), 0)
    assert.deepEqual(@queue.getJobIds(), [])
    assert.isFalse(@queue.isJobInProgress(@jobId1))
    assert.isFalse(@queue.isJobInProgress(@jobId2))
    assert.isFalse(@queue.isInProgress())
    assert.isUndefined(@queue.getCurrentJobId())
    assert.isFalse(@queue.hasJob(@jobId1))
    assert.isFalse(@queue.hasJob(@jobId2))

  it "waitJobStart", ->
    @queue.add(@cb1, @jobId1)
    @queue.add(@cb2, @jobId2)

    assert.isTrue(@queue.isJobInProgress(@jobId1))
    await @queue.waitJobStart(@jobId2)

    assert.isTrue(@queue.isJobInProgress(@jobId2))
    assert.isTrue(@queue.isInProgress())

    await @queue.waitCurrentJobFinished()

    assert.isFalse(@queue.isInProgress())

  it "auto generated ids", ->
    resolvedJobId1 = @queue.add(@cb1)
    resolvedJobId2 = @queue.add(@cb2)

    assert.equal(resolvedJobId1, '0')
    assert.equal(resolvedJobId2, '1')

  it "update job with the same id in the queue", ->
    @queue.add(
      () => Promise.resolve(),
      @jobId1
    )
    @queue.add(@cb1, @jobId2)
    @queue.add(@cb2, @jobId2)

    assert.equal(@queue.getQueueLength(), 1)
    assert.equal(@queue.queue[0][1], @cb2)

  it "refuse new jobs which is in progress with the same id", ->
    @queue.add(@cb1, @jobId1)
    @queue.add(@cb2, @jobId1)

    assert.equal(@queue.getQueueLength(), 0)
    assert.equal(@queue.currentJob[1], @cb1)

  it "job throws an error - the next job will be started", ->
    @cb1 = sinon.stub().returns(Promise.reject('err1'))
    handler = sinon.spy()
    @queue.onJobEnd(handler)

    @queue.add(@cb1, @jobId1)
    @queue.add(@cb2, @jobId2)

    await @queue.waitJobFinished(@jobId2)

    sinon.assert.calledOnce(@cb1)
    sinon.assert.calledOnce(@cb2)
    sinon.assert.calledTwice(handler)
    sinon.assert.calledWith(handler.getCall(0), 'err1', @jobId1)
    sinon.assert.calledWith(handler.getCall(1), undefined, @jobId2)

  it "cancelJob job in queue", ->
    @queue.add(@cb1, @jobId1)
    @queue.add(@cb2, @jobId2)

    @queue.cancelJob(@jobId2)

    # TODO: check event
    # TODO: проверить чтобы что-то осталось

    assert.equal(@queue.getQueueLength(), 0)

  it "cancelJob current job. It won't called ever", ->
    handler = sinon.spy()
    @queue.onJobEnd(handler)
    @queue.add(@cb1, @jobId1)
    @queue.add(@cb2, @jobId2)

    @queue.cancelJob(@jobId1)

    assert.deepEqual(@queue.getJobIds(), [@jobId2])
    assert.isTrue(@queue.isJobInProgress(@jobId2))

    await @queue.waitCurrentJobFinished()

    sinon.assert.calledTwice(handler)
    sinon.assert.calledWith(handler.getCall(0), undefined, @jobId1)
    sinon.assert.calledWith(handler.getCall(1), undefined , @jobId2)

  it "destroy", ->
    @queue.add(@cb1, @jobId1)
    @queue.add(@cb2, @jobId2)

    @queue.destroy()

    assert.isUndefined(@queue.currentJob)
    assert.isUndefined(@queue.runningTimeout)
    assert.isUndefined(@queue.queue)

  it "onJobStart - emits as soon as first job is added", ->
    handler1 = sinon.spy()
    handler2 = sinon.spy()

    @queue.onJobStart(handler1)

    @queue.add(@cb1, @jobId1)

    @queue.onJobStart(handler2)

    await @queue.waitCurrentJobFinished()

    sinon.assert.calledOnce(handler1)
    sinon.assert.notCalled(handler2)

  it "onJobStart - emits after current job finished", ->
    handler1 = sinon.spy()

    @queue.add(@cb1)
    @queue.add(@cb2)

    @queue.onJobStart(handler1)

    await @queue.waitCurrentJobFinished()

    sinon.assert.calledOnce(handler1)

  it "removeListener", ->
    handler1 = sinon.spy()

    handlerIndex = @queue.onJobStart(handler1)

    @queue.removeListener(handlerIndex)
    @queue.add(@cb1)

    await @queue.waitCurrentJobFinished()

    sinon.assert.notCalled(handler1)

  it "timeout - job will be cancelled but the next job will be started", ->
    clock = sinon.useFakeTimers()
    promised = new Promised()
    cb = () => promised.promise
    handler1 = sinon.spy()

    @queue.add(cb, @jobId1)
    @queue.add(@cb2, @jobId2)
    @queue.onJobEnd(handler1)

    clock.tick(120000)

    sinon.assert.calledOnce(handler1)

    await @queue.waitJobFinished(@jobId2)

    sinon.assert.calledTwice(handler1)

    promised.resolve()

    sinon.assert.calledTwice(handler1)

    clock.restore()

  it "order of calling cb - waitJobFinished() will be called on the next tick", ->
    cb1Spy = sinon.spy()
    cb2Spy = sinon.spy()
    cb1 = () =>
      cb1Spy()
      return Promise.resolve()
    cb2 = () =>
      cb2Spy()
      return Promise.resolve()

    @queue.add(cb1, 'writing')
    @queue.add(cb2, 'reading')

    assert.equal(@queue.getCurrentJobId(), 'writing')
    sinon.assert.calledOnce(cb1Spy)
    sinon.assert.notCalled(cb2Spy)

    await @queue.waitJobFinished('writing')

    #assert.isUndefined(@queue.getCurrentJobId())
    # actually there is should be undefined, but "waitJobFinished" promise has been fulfilled
    # on the next tick and at the moment the next job is started
    assert.equal(@queue.getCurrentJobId(), 'reading')
    sinon.assert.calledOnce(cb1Spy)
    sinon.assert.calledOnce(cb2Spy)
