Polling = require('../../../host/helpers/Polling').default;


describe.only 'Polling', ->
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

    clearInterval(@polling.currentPolls[@id][0])

    assert.isArray(@polling.currentPolls[@id])

  it "start - don't run polling if it's", ->
    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))

    @polling.start(methodWhichWillPoll, 10000, @id)
    assert.throws(() => @polling.start(methodWhichWillPoll, 10000, @id))

    @polling.stop(@id)

    sinon.assert.calledOnce(methodWhichWillPoll)
    assert.isUndefined(@polling.currentPolls[@id])
