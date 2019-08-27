RequestQueue = require('../../../system/lib/RequestQueue').default;


describe 'system.lib.RequestQueue', ->
  beforeEach ->
    @jobId1 = 'jobId1'
    @jobId2 = 'jobId2'
    #@cbPromise = () => new Promise((resolve) => setTimeout(resolve, 1))
    @cbPromise = () => Promise.resolve()
    @cb1 = sinon.stub().returns(@cbPromise())
    @cb2 = sinon.stub().returns(@cbPromise())
    @logError = sinon.spy()
    @queue = new RequestQueue(@logError)

  it "ordinary queue with jobs with different id. Check queue states", ->
    resolvedJobId1 = @queue.request(@jobId1, @cb1)
    @queue.request(@jobId2, @cb2)

    assert.equal(resolvedJobId1, @jobId1)
    assert.equal(@queue.getQueueLength(), 1)
    assert.deepEqual(@queue.getJobIds(), [@jobId1, @jobId2])
    assert.isTrue(@queue.isJobInProgress(@jobId1))
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
    assert.isUndefined(@queue.getCurrentJobId())
    assert.isFalse(@queue.hasJob(@jobId1))
    assert.isFalse(@queue.hasJob(@jobId2))

  it "waitJobStart", ->
    @queue.request(@jobId1, @cb1)
    @queue.request(@jobId2, @cb2)

    assert.isTrue(@queue.isJobInProgress(@jobId1))
    await @queue.waitJobStart(@jobId2)

    assert.isTrue(@queue.isJobInProgress(@jobId2))

  it "auto generated ids", ->
    resolvedJobId1 = @queue.request(undefined, @cb1)
    resolvedJobId2 = @queue.request(undefined, @cb2)

    assert.equal(resolvedJobId1, '0')
    assert.equal(resolvedJobId2, '1')

  it "update job in queue with the same id", ->
    @queue.request(@jobId1, () => Promise.resolve())
    @queue.request(@jobId2, @cb1)
    @queue.request(@jobId2, @cb2)

    assert.equal(@queue.getQueueLength(), 1)
    assert.equal(@queue.queue[0][1], @cb2)

  it "default mode: refuse new jobs which is in progress with the same id", ->
    @queue.request(@jobId1, @cb1)
    @queue.request(@jobId1, @cb2)

    assert.equal(@queue.getQueueLength(), 0)
    assert.equal(@queue.currentJob[1], @cb1)

  it "recall mode: set recallCb to which is in progress with the same id", ->
    @queue.request(@jobId1, @cb1, 'recall')
    @queue.request(@jobId1, @cb2, 'recall')

    assert.equal(@queue.getQueueLength(), 0)
    assert.isTrue(@queue.jobHasRecallCb(@jobId1))
    assert.equal(@queue.currentJob[1], @cb1)
    assert.equal(@queue.currentJob[4], @cb2)

  it "recall mode: update recallCb to which is in progress with the same id", ->
    @queue.request(@jobId1, (() => Promise.resolve()), 'recall')
    @queue.request(@jobId1, @cb1, 'recall')
    @queue.request(@jobId1, @cb2, 'recall')

    assert.equal(@queue.currentJob[4], @cb2)

  it "recall mode: call recall job", ->
    @queue.request(@jobId1, @cb1, 'recall')
    @queue.request(@jobId1, @cb2, 'recall')

    sinon.assert.calledOnce(@cb1)
    sinon.assert.notCalled(@cb2)
    assert.deepEqual(@queue.getJobIds(), [@jobId1])

    await @queue.waitJobFinished(@jobId1)

    sinon.assert.calledOnce(@cb1)
    sinon.assert.calledOnce(@cb2)
    assert.deepEqual(@queue.getJobIds(), [@jobId1])

    await @queue.waitJobFinished(@jobId1)

    assert.deepEqual(@queue.getJobIds(), [])

  it "cancelJob job in queue", ->
    @queue.request(@jobId1, @cb1)
    @queue.request(@jobId2, @cb2)

    @queue.cancelJob(@jobId2)

    assert.equal(@queue.getQueueLength(), 0)

  it "cancelJob current job. It won't called ever", ->
    handler = sinon.spy()
    @queue.onJobEnd(handler)
    @queue.request(@jobId1, @cb1)
    @queue.request(@jobId2, @cb2)

    @queue.cancelJob(@jobId1)

    assert.deepEqual(@queue.getJobIds(), [@jobId2])
    assert.isTrue(@queue.isJobInProgress(@jobId2))

    await @queue.waitCurrentJobFinished()

    sinon.assert.calledTwice(handler)
    sinon.assert.calledWith(handler.getCall(0), 'Job was cancelled', @jobId1)
    sinon.assert.calledWith(handler.getCall(1), undefined , @jobId2)

  it "job throws an error - the next job will start", ->
    @cb1 = sinon.stub().returns(Promise.reject('err1'))
    handler = sinon.spy()
    @queue.onJobEnd(handler)

    @queue.request(@jobId1, @cb1)
    @queue.request(@jobId2, @cb2)

    await @queue.waitJobFinished(@jobId2)

    sinon.assert.calledOnce(@cb1)
    sinon.assert.calledOnce(@cb2)
    sinon.assert.calledTwice(handler)
    sinon.assert.calledWith(handler.getCall(0), 'err1', @jobId1)
    sinon.assert.calledWith(handler.getCall(1), undefined, @jobId2)
