RequestQueue = require('../../../system/helpers/RequestQueue').default;


describe.only 'system.helpers.RequestQueue', ->
  beforeEach ->
    @jobId1 = 'jobId1'
    @jobId2 = 'jobId2'
    @cb1 = sinon.stub().returns(Promise.resolve())
    @cb2 = sinon.stub().returns(Promise.resolve())
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

    # TODO: do it
#    await @queue.waitCurrentJobFinished()

#    sinon.assert.calledOnce(@cb1)
#    sinon.assert.notCalled(@cb2)
#    assert.equal(@queue.getQueueLength(), 0)
#    assert.deepEqual(@queue.getJobIds(), [@jobId1])
#    assert.isFalse(@queue.isJobInProgress(@jobId1))
#    assert.isTrue(@queue.isJobInProgress(@jobId2))
#    assert.equal(@queue.getCurrentJobId(), @jobId2)
#    assert.isFalse(@queue.hasJob(@jobId1))
#    assert.isTrue(@queue.hasJob(@jobId2))

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

  it "auto generated ids", ->
    resolvedJobId1 = @queue.request(undefined, @cb1)
    resolvedJobId2 = @queue.request(undefined, @cb2)

    assert.equal(resolvedJobId1, '0')
    assert.equal(resolvedJobId2, '1')

  # TODO: test timeout
  # TODO: add cb witch throws an error
  # TODO: events
  # TODO: default mode
  # TODO: recall mode
  # TODO: cancel
