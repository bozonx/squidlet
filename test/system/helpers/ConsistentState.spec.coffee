ConsistentState = require('../../../system/helpers/ConsistentState').default;


describe.only 'system.helpers.ConsistentState', ->
  beforeEach ->
    @logError = sinon.spy()
    @stateGetterResult = {}
    @stateGetter = sinon.stub().returns(@stateGetterResult)
    @stateUpdater = sinon.spy()
    @initializeResult = {initParam: 1}
    @initialize = sinon.stub().returns(Promise.resolve(@initializeResult))
    @getterResult = {getterParam: 1}
    @getter = sinon.stub().returns(Promise.resolve(@getterResult))
    @setter = sinon.stub().returns(Promise.resolve())
    @consistentState = new ConsistentState(@logError, @stateGetter, @stateUpdater, @initialize, @getter, @setter)

  it "init - no initialize and getter - error", ->
    @consistentState.initialize = undefined
    @consistentState.getter = undefined

    assert.isRejected(@consistentState.init())

  it "init - use initialize cb", ->
    result = {param: 1}
    @consistentState.getter = undefined
    @consistentState.requestGetter = sinon.stub().returns(Promise.resolve(result))

    await @consistentState.init()

    sinon.assert.calledOnce(@consistentState.requestGetter)
    sinon.assert.calledWith(@consistentState.requestGetter, @initialize)
    sinon.assert.calledOnce(@stateUpdater)
    sinon.assert.calledWith(@stateUpdater, result)

  it "init - use getter", ->
    @consistentState.initialize = undefined
    @consistentState.requestGetter = sinon.stub().returns(Promise.resolve({param: 1}))

    await @consistentState.init()

    sinon.assert.calledWith(@consistentState.requestGetter, @getter)

  it "load", ->
    result = {param: 1}
    @consistentState.requestGetter = sinon.stub().returns(Promise.resolve(result))

    await @consistentState.load()

    sinon.assert.calledOnce(@consistentState.requestGetter)
    sinon.assert.calledWith(@consistentState.requestGetter, @getter)
    sinon.assert.calledOnce(@stateUpdater)
    sinon.assert.calledWith(@stateUpdater, result)

  it "load - no getter - do nothing", ->
    @consistentState.getter = undefined
    @consistentState.requestGetter = sinon.spy()

    await @consistentState.load()

    sinon.assert.notCalled(@consistentState.requestGetter)
    sinon.assert.notCalled(@stateUpdater)

  it "load - when there is a reading process - return it's promise", ->
    @consistentState.readingPromise = Promise.resolve()
    @consistentState.requestGetter = sinon.spy()

    await @consistentState.load()

    sinon.assert.notCalled(@consistentState.requestGetter)
    sinon.assert.notCalled(@stateUpdater)

  it "write", ->

  it "write - no setter - just update the local state", ->

  it "write - reading is in progress - wait reading promise", ->

