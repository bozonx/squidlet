Poling = require('../../src/helpers/Poling');


describe.only 'Poling', ->
  beforeEach ->
    log = {
      warn: ->
    }
    @poling = new Poling(log)

  it "startPoling", (done) ->
    listenHandler = (err, data) ->
      expect(err).to.be.equal(null)
      expect(data).to.be.equal(1)
      done()

    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))
    @poling.addPolingListener(listenHandler)

    @poling.startPoling(methodWhichWillPoll, 10000)
    clearInterval(@poling._pollIntervalTimer)

    expect(@poling._pollIntervalTimer).to.be.not.equal(null)
    expect(@poling._methodWhichWillPoll).to.be.not.equal(methodWhichWillPoll)

  it "startPoling - don't run polling if it's", ->
    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))

    @poling.startPoling(methodWhichWillPoll, 10000)
    @poling.startPoling(methodWhichWillPoll, 10000)

    clearInterval(@poling._pollIntervalTimer)

    expect(methodWhichWillPoll).to.be.calledOnce
