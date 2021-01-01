Polling = require('../../../system/lib/Polling').default;


describe 'system.lib.Polling', ->
  beforeEach ->
    @id = 'myId'
    @polling = new Polling()

  it "start", (done) ->
    listenHandler = (err, data) ->
      assert.isNull(err)
      assert.equal(data, 1)
      done()

    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))
    @polling.addListener(listenHandler, @id)

    @polling.start(methodWhichWillPoll, 10000, @id)

    assert.isArray(@polling.currentPolls[@id])
    sinon.assert.calledOnce(methodWhichWillPoll)

    clearInterval(@polling.currentPolls[@id][0])

  it "start - don't run polling if it's in progress", ->
    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))

    @polling.start(methodWhichWillPoll, 10000, @id)
    assert.throws(() => @polling.start(methodWhichWillPoll, 10000, @id))

    @polling.stop(@id)

  it "stop", ->
    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))

    @polling.start(methodWhichWillPoll, 10000, @id)

    @polling.stop(@id)

    sinon.assert.calledOnce(methodWhichWillPoll)
    assert.isUndefined(@polling.currentPolls[@id])

  it "restart", ->
    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))

    @polling.start(methodWhichWillPoll, 10000, @id)

    await @polling.restart(@id)

    assert.isArray(@polling.currentPolls[@id])
    sinon.assert.calledTwice(methodWhichWillPoll)

    clearInterval(@polling.currentPolls[@id][0])
