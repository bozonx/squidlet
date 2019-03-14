Polling = require('../../../host/helpers/Polling').default;


describe 'Polling', ->
  beforeEach ->
    @id = 'myId'
    @polling = new Polling()

  it "start", (done) ->
    listenHandler = (err, data) ->
      expect(err).to.be.equal(null)
      expect(data).to.be.equal(1)
      done()

    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))
    @polling.addListener(listenHandler, @id)

    @polling.start(methodWhichWillPoll, 10000, @id)
    clearInterval(@polling.intervals[@id])

    assert.isObject(@polling.intervals[@id])

  it "start - don't run polling if it's", ->
    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))

    @polling.start(methodWhichWillPoll, 10000, @id)
    assert.throws(() => @polling.start(methodWhichWillPoll, 10000, @id))

    @polling.stop(@id)

    expect(methodWhichWillPoll).to.be.calledOnce
    assert.isUndefined(@polling.intervals[@id])
