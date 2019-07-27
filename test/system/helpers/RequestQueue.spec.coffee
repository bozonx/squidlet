RequestQueue = require('../../../system/helpers/RequestQueue').default;


describe.only 'system.helpers.RequestQueue', ->
  beforeEach ->
    @jobId1 = 'jobId1'
    @jobId2 = 'jobId2'
    @cb1 = sinon.stub().returns(Promise.resolve())
    @cb2 = sinon.stub().returns(Promise.resolve())
    @logError = sinon.spy()
    @queue = new RequestQueue(@logError)

  it "ordinary queue with jobs with different id", ->
    resolvedJobId1 = @queue.request(@jobId1, @cb1)
    @queue.request(@jobId2, @cb2)

    assert.equal(resolvedJobId1, @jobId1)
    assert.equal(@queue.getQueueLength(), 1)
    assert.deepEqual(@queue.getJobIds(), [@jobId1, @jobId2])
    assert.isTrue(@queue.isJobInProgress(@jobId1))
    assert.equal(@queue.getCurrentJobId(), @jobId1)
    assert.isTrue(@queue.hasJob(@jobId1))
    assert.isTrue(@queue.hasJob(@jobId2))

    @queue.waitJobFinished(@jobId2)

    sinon.assert.calledOnce(@cb1)
    sinon.assert.calledOnce(@cb2)

  it "ordinary queue - auto generated ids", ->

  # TODO: test timeout
  # TODO: add cb witch throws an error
