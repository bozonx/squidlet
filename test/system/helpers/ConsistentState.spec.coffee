ConsistentState = require('../../../system/helpers/ConsistentState').default;


describe.only 'system.helpers.ConsistentState', ->
  beforeEach ->
    @cbPromise = (dataToResolve) => new Promise((resolve) =>
      setTimeout((() -> resolve(dataToResolve)), 1)
    )
    @stateObj = {}
    @logError = sinon.spy()
    @stateGetter = () => @stateObj
    @stateUpdater = (partialState) =>
      @stateObj = {@stateObj..., partialState...}
    @initializeResult = {initParam: 1}
    @initialize = () => Promise.resolve(@initializeResult)
    @getterResult = {getterParam: 1}
    @getter = sinon.stub().returns(@cbPromise(@getterResult))
    @setter = sinon.stub().returns(@cbPromise())
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
    @consistentState.getter = undefined
    @consistentState.queue.request = sinon.spy()

    await @consistentState.load()

    sinon.assert.notCalled(@consistentState.queue.request)

  it "write once", ->
    @stateObj = {oldState: 1}

    promise = @consistentState.write({writeParam: 1})

    assert.deepEqual(@consistentState.actualRemoteState, {oldState: 1})
    assert.deepEqual(@consistentState.paramsListToSave, ['writeParam'])
    assert.deepEqual(@consistentState.getState(), {oldState: 1, writeParam: 1})

    await promise

    assert.isUndefined(@consistentState.actualRemoteState)
    assert.isUndefined(@consistentState.paramsListToSave)
    assert.deepEqual(@consistentState.getState(), {oldState: 1, writeParam: 1})
    sinon.assert.calledOnce(@setter)
    sinon.assert.calledWith(@setter, {writeParam: 1})

  it "write - no setter - just update the local state", ->
    data = {writeParam: 1}
    @consistentState.setter = undefined
    @consistentState.queue.request = sinon.spy()

    await @consistentState.write(data)

    sinon.assert.notCalled(@consistentState.queue.request)

  #it "write - reading is in progress - wait reading promise", ->

  # TODO: test error loading
  # TODO: test error writing
