Poling = require('../../src/helpers/Poling');


describe 'Poling', ->
  beforeEach ->
    @poling = new Poling()

  it "startPoling", (done) ->
    listenHandler = (err, data) ->
      expect(err).to.be.equal(null)
      expect(data).to.be.equal(1)
      done()

    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))
    @poling.addPolingListener(listenHandler)

    @poling.startPoling(methodWhichWillPoll, 10000)
    clearInterval(@poling.pollIntervalTimerId)

    assert.notEqual(@poling.pollIntervalTimerId, -1)

  it "startPoling - don't run polling if it's", ->
    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))

    @poling.startPoling(methodWhichWillPoll, 10000)
    assert.throws(() => @poling.startPoling(methodWhichWillPoll, 10000))

    @poling.stopPoling()

    expect(methodWhichWillPoll).to.be.calledOnce
