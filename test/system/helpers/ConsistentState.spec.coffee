ConsistentState = require('../../../system/helpers/ConsistentState').default;


describe 'system.helpers.ConsistentState', ->
  beforeEach ->
    @logError: sinon.spy()
    @stateGetterResult = {}
    @stateGetter = sinon.stub().returns(@stateGetterResult)
    @stateUpdater = sinon.spy()
    @initializeResult = {}
    @initialize = sinon.stub().returns(Promise.resolve(@initializeResult))
    @getterResult = {}
    @getter = sinon.stub().returns(Promise.resolve(@getterResult))
    @setter = sinon.stub().returns(Promise.resolve())
    @consistentState = new ConsistentState(logError, @stateGetter, @stateUpdater, @initialize, @getter, @setter)

  it "init", ->
