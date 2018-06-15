Poling = require('../../src/helpers/Poling').default;


describe 'Poling', ->
  beforeEach ->
    @id = 'myId'
    @poling = new Poling()

  it "startPoling", (done) ->
    listenHandler = (err, data) ->
      expect(err).to.be.equal(null)
      expect(data).to.be.equal(1)
      done()

    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))
    @poling.addListener(listenHandler, @id)

    @poling.startPoling(methodWhichWillPoll, 10000, @id)
    clearInterval(@poling.intervals[@id])

    assert.isObject(@poling.intervals[@id])

  it "startPoling - don't run polling if it's", ->
    methodWhichWillPoll = sinon.stub().returns(Promise.resolve(1))

    @poling.startPoling(methodWhichWillPoll, 10000, @id)
    assert.throws(() => @poling.startPoling(methodWhichWillPoll, 10000, @id))

    @poling.stopPoling(@id)

    expect(methodWhichWillPoll).to.be.calledOnce
    assert.isUndefined(@poling.intervals[@id])
