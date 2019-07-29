ConsistentState = require('../../../system/helpers/ConsistentState').default;


describe.only 'system.helpers.ConsistentState', ->
  beforeEach ->
    @stateObj = {}
    @logError = sinon.spy()
    @stateGetter = () => @stateObj
    @stateUpdater = (partialState) =>
      @stateObj = {@stateObj..., partialState...}
    @initializeResult = {initParam: 1}
    @initialize = () => Promise.resolve(@initializeResult)
    @getterResult = {getterParam: 1}
    @getter = sinon.stub().returns(Promise.resolve(@getterResult))
    @setter = sinon.stub().returns(Promise.resolve())
    @consistentState = new ConsistentState(
      @logError,
      @stateGetter,
      @stateUpdater,
      undefined,
      @initialize,
      @getter,
      @setter
    )

  it "init - no initialize and getter - error", ->
    @consistentState.initialize = undefined
    @consistentState.getter = undefined

    assert.isRejected(@consistentState.init())

  it "init - use initialize cb", ->
    await @consistentState.init()

    assert.deepEqual(@consistentState.getState(), @initializeResult)

  it "init - use getter", ->
    @consistentState.initialize = undefined

    await @consistentState.init()

    assert.deepEqual(@consistentState.getState(), @getterResult)

  it "load once", ->
    promise = @consistentState.load()

    assert.isTrue(@consistentState.isReading())
    assert.deepEqual(@consistentState.getState(), {})

    await promise

    assert.deepEqual(@consistentState.getState(), @getterResult)

  it "load twice - don't do two request", ->
    promise1 =  @consistentState.load()
    promise2 =  @consistentState.load()

    await promise1
    await promise2

    sinon.assert.calledOnce(@getter)

  it "load - no getter - do nothing", ->
#    @consistentState.getter = undefined
#    @consistentState.requestGetter = sinon.spy()
#
#    await @consistentState.load()
#
#    sinon.assert.notCalled(@consistentState.requestGetter)
#    sinon.assert.notCalled(@stateUpdater)

  it "load - when there is a reading process - return it's promise", ->
#    @consistentState.readingPromise = Promise.resolve()
#    @consistentState.requestGetter = sinon.spy()
#
#    await @consistentState.load()
#
#    sinon.assert.notCalled(@consistentState.requestGetter)
#    sinon.assert.notCalled(@stateUpdater)

  it "write", ->

  it "write - no setter - just update the local state", ->

  it "write - reading is in progress - wait reading promise", ->

