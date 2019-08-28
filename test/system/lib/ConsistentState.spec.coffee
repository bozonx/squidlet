ConsistentState = require('../../../system/lib/ConsistentState').default;


describe 'system.lib.ConsistentState', ->
  beforeEach ->
    @cbPromise = (dataToResolve) => new Promise((resolve) =>
      setTimeout((() -> resolve(dataToResolve)), 1)
    )
    #@cbPromise = (dataToResolve) => Promise.resolve(dataToResolve)
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

    assert.throws(() => @consistentState.init())

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

    assert.isTrue(@consistentState.isWriting())
    assert.deepEqual(@consistentState.actualRemoteState, {oldState: 1})
    assert.deepEqual(@consistentState.paramsListToSave, ['writeParam'])
    assert.deepEqual(@consistentState.getState(), {oldState: 1, writeParam: 1})

    await promise

    assert.isFalse(@consistentState.isWriting())
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

  it "add writing to queue while reading is in progress - wait while reading is finished", ->
    loadPromise = @consistentState.load()
    writePromise = @consistentState.write({writeParam: 1})

    assert.isTrue(@consistentState.isReading())
    assert.isFalse(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {writeParam: 1})

    await loadPromise

    assert.isFalse(@consistentState.isReading())
    assert.isTrue(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {getterParam: 1, writeParam: 1})
    assert.deepEqual(@consistentState.actualRemoteState, {getterParam: 1});

    await writePromise

    assert.isFalse(@consistentState.isReading())
    assert.isFalse(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {getterParam: 1, writeParam: 1})

  it "add reading to queue while writing is in progress - wait while reading is finished", ->
    writePromise = @consistentState.write({writeParam: 1})
    loadPromise = @consistentState.load()

    assert.isFalse(@consistentState.isReading())
    assert.isTrue(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {writeParam: 1})

    await writePromise

    assert.isTrue(@consistentState.isReading())
    assert.isFalse(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {writeParam: 1})

    await loadPromise

    assert.isFalse(@consistentState.isReading())
    assert.isFalse(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {getterParam: 1, writeParam: 1})

  it "add writing several times while the first writing is in progress - it will combine stat", ->
    writePromise1 = @consistentState.write({param1: 1})
    @consistentState.write({param2: 2})
    writePromise3 = @consistentState.write({param2: 3, param3: 3})

    assert.isTrue(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {param1: 1, param2: 3, param3: 3})
    sinon.assert.calledOnce(@setter)
    sinon.assert.calledWith(@setter, {param1: 1})
    assert.deepEqual(@consistentState.actualRemoteState, {});
    assert.deepEqual(@consistentState.paramsListToSave, ['param1', 'param2', 'param3']);

    await writePromise1

    assert.isTrue(@consistentState.isWriting())
    sinon.assert.calledTwice(@setter)
    sinon.assert.calledWith(@setter.getCall(1), {param2: 3, param3: 3})
    assert.deepEqual(@consistentState.actualRemoteState, {param1: 1});
    assert.deepEqual(@consistentState.paramsListToSave, ['param2', 'param3']);

    await writePromise3

    assert.isFalse(@consistentState.isWriting())
    sinon.assert.calledTwice(@setter)
    assert.deepEqual(@consistentState.getState(), {param1: 1, param2: 3, param3: 3})
    assert.isUndefined(@consistentState.actualRemoteState);
    assert.isUndefined(@consistentState.paramsListToSave);

  it "add writing several times while the reading is in progress - it will combine state", ->
    loadPromise = @consistentState.load()
    @consistentState.write({param1: 1})
    writePromise2 = @consistentState.write({param2: 2})

    assert.deepEqual(@consistentState.getState(), {param1: 1, param2: 2})
    sinon.assert.notCalled(@setter)

    await loadPromise

    assert.deepEqual(@consistentState.getState(), {getterParam: 1, param1: 1, param2: 2})

    await writePromise2

    sinon.assert.calledOnce(@setter)
    sinon.assert.calledWith(@setter, {param1: 1, param2: 2})

  it "clear state on error while writing - restore state", ->
    @consistentState.setter = sinon.stub().returns(Promise.reject('err'))

    loadPromise = @consistentState.load()
    writePromise1 = @consistentState.write({param1: 1})
    writePromise2 = @consistentState.write({param2: 2})

    assert.deepEqual(@consistentState.getState(), {param1: 1, param2: 2})

    await loadPromise

    assert.deepEqual(@consistentState.getState(), {getterParam: 1, param1: 1, param2: 2})

    try
      await writePromise1
      await writePromise2
    catch err
      assert.deepEqual(@consistentState.getState(), {getterParam: 1, param1: undefined, param2: undefined})
      assert.isUndefined(@consistentState.actualRemoteState);
      assert.isUndefined(@consistentState.paramsListToSave);

      #await new Promise((resolve) => setTimeout(resolve, 100))

      sinon.assert.calledOnce(@consistentState.setter)

      return

    throw new Error('Setter has to be rejected');

  it "first write is OK and second failed - revert state to first save step", ->
    saveCounter = 0

    @consistentState.setter = (params...) =>
      saveCounter++
      if (saveCounter > 1)
        return Promise.reject('err')
      else
        return @setter(params...)

    writePromise1 = @consistentState.write({param1: 1})
    writePromise2 = @consistentState.write({param1: 2, param2: 2})

    await writePromise1

    try
      await writePromise2

    assert.isRejected(writePromise2)
    sinon.assert.calledOnce(@setter)
    assert.deepEqual(@consistentState.getState(), {param1: 1, param2: undefined})
    assert.isUndefined(@consistentState.actualRemoteState);
    assert.isUndefined(@consistentState.paramsListToSave);

  it "write - error in queue.request - cleanup", ->
    @stateUpdater({param: 1})
    @consistentState.queue.request = () => throw new Error('err')

    assert.isRejected(@consistentState.write({newParam: 1}))

    assert.deepEqual(@consistentState.getState(), {param: 1, newParam: undefined})
    assert.isUndefined(@consistentState.actualRemoteState);
    assert.isUndefined(@consistentState.paramsListToSave);

  it "after failed load the next saving will run", ->
    @consistentState.getter = () => Promise.reject('err')

    loadPromise = @consistentState.load()
    writePromise = @consistentState.write({param: 1})

    assert.isRejected(loadPromise)

    await writePromise

    sinon.assert.calledOnce(@setter)
    assert.deepEqual(@consistentState.getState(), {param: 1})

  it "setIncomeState - just set", ->
    @consistentState.setIncomeState({param: 1})

    assert.deepEqual(@consistentState.getState(), {param: 1})

  it "setIncomeState - while reading - do nothing", ->
    @consistentState.isReading = () => true

    @consistentState.setIncomeState({param: 1})

    assert.deepEqual(@consistentState.getState(), {})

  it "setIncomeState - while writing - carefully update state", ->
    @stateObj = { actualParam: 1, savingParam: 2 }
    @consistentState.isWriting = () => true
    @consistentState.actualRemoteState = {
      actualParam: 1
    }
    @consistentState.paramsListToSave = ['savingParam']

    @consistentState.setIncomeState({newParam: 3, actualParam: 3, savingParam: 3})

    assert.deepEqual(@consistentState.getState(), {
      newParam: 3
      actualParam: 3
      savingParam: 2
    })
    assert.deepEqual(@consistentState.actualRemoteState, {
      newParam: 3
      actualParam: 3
      savingParam: 3
    })

  it "destroy", ->
    @consistentState.queue.destroy = sinon.spy()

    @consistentState.destroy()

    sinon.assert.calledOnce(@consistentState.queue.destroy)
    assert.isUndefined(@consistentState.actualRemoteState)
    assert.isUndefined(@consistentState.paramsListToSave)