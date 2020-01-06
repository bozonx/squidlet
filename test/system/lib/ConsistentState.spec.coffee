ConsistentState = require('../../../system/lib/ConsistentState').default;
Promised = require('../../../system/lib/Promised').default;


describe 'system.lib.ConsistentState', ->
  beforeEach ->
    @stateObj = {}
    @logError = sinon.spy()
    @stateGetter = () => @stateObj
    @stateUpdater = (partialState) =>
      @stateObj = {@stateObj..., partialState...}
    @initializeResult = {initParam: 1}
    @initialize = () => Promise.resolve(@initializeResult)
    @getterResult = {getterParam: 1}
    @getterSpy = sinon.spy()
    @getterPromised = new Promised()
    @getter = () =>
      @getterSpy()
      return @getterPromised.promise
    @setterSpy = sinon.spy()
    @setterPromised = new Promised()
    @setter = (data) =>
      @setterSpy(data)
      return @setterPromised.promise

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

    @getterPromised.resolve(@getterResult)
    await @consistentState.init()

    assert.deepEqual(@consistentState.getState(), @getterResult)

  it "load once", ->
    promise = @consistentState.load()

    assert.isTrue(@consistentState.isReading())
    assert.deepEqual(@consistentState.getState(), {})

    @getterPromised.resolve(@getterResult)
    await promise

    assert.deepEqual(@consistentState.getState(), @getterResult)

  it "load twice - don't do two request", ->
    promise1 =  @consistentState.load()
    promise2 =  @consistentState.load()

    @getterPromised.resolve(@getterResult)
    await promise1
    await promise2

    sinon.assert.calledOnce(@getterSpy)

  it "load - no getter - do nothing", ->
    @consistentState.getter = undefined
    @consistentState.queue.request = sinon.spy()

    @getterPromised.resolve(@getterResult)
    await @consistentState.load()

    sinon.assert.notCalled(@consistentState.queue.request)

  it "write once", ->
    @stateObj = {oldState: 1}

    promise = @consistentState.write({writeParam: 1})

    assert.isTrue(@consistentState.isWriting())
    assert.isTrue(@consistentState.isInProgress())
    assert.deepEqual(@consistentState.actualRemoteState, {oldState: 1})
    assert.deepEqual(@consistentState.paramsListToSave, ['writeParam'])
    assert.deepEqual(@consistentState.getState(), {oldState: 1, writeParam: 1})

    @setterPromised.resolve()
    await promise

    assert.isFalse(@consistentState.isWriting())
    assert.isFalse(@consistentState.isInProgress())
    assert.isUndefined(@consistentState.actualRemoteState)
    assert.isUndefined(@consistentState.paramsListToSave)
    assert.deepEqual(@consistentState.getState(), {oldState: 1, writeParam: 1})
    sinon.assert.calledOnce(@setterSpy)
    sinon.assert.calledWith(@setterSpy, {writeParam: 1})

  it "write - no setter - just update the local state", ->
    data = {writeParam: 1}
    @consistentState.setter = undefined
    @consistentState.queue.add = sinon.spy()

    await @consistentState.write(data)

    sinon.assert.notCalled(@consistentState.queue.add)

  it "add writing twice to queue while reading is in progress - wait while reading is finished. State of both writings will be combined", ->
    loadPromise = @consistentState.load()
    @consistentState.write({writeParam: 1})
    writePromise = @consistentState.write({writeParam: 2, otherParam: 2})

    assert.isTrue(@consistentState.isReading())
    assert.isFalse(@consistentState.isWriting())
    assert.isTrue(@consistentState.isInProgress())
    assert.deepEqual(@consistentState.getState(), {writeParam: 2, otherParam: 2})

    @getterPromised.resolve(@getterResult)
    await loadPromise

    assert.isFalse(@consistentState.isReading())
    assert.isTrue(@consistentState.isWriting())
    assert.isTrue(@consistentState.isInProgress())
    assert.deepEqual(@consistentState.getState(), {getterParam: 1, writeParam: 2, otherParam: 2})
    assert.deepEqual(@consistentState.actualRemoteState, {getterParam: 1});

    @setterPromised.resolve()
    await writePromise

    assert.isFalse(@consistentState.isReading())
    assert.isFalse(@consistentState.isWriting())
    assert.isFalse(@consistentState.isInProgress())
    assert.deepEqual(@consistentState.getState(), {getterParam: 1, writeParam: 2, otherParam: 2})

  it "add reading to queue while writing is in progress - wait while writing is finished", ->
    writePromise = @consistentState.write({writeParam: 1})
    loadPromise = @consistentState.load()

    assert.isFalse(@consistentState.isReading())
    assert.isTrue(@consistentState.isWriting())
    assert.isTrue(@consistentState.isInProgress())
    assert.deepEqual(@consistentState.getState(), {writeParam: 1})
    sinon.assert.notCalled(@getterSpy)

    # write has been finished and reading is started
    @setterPromised.resolve()

    assert.deepEqual(@consistentState.getState(), {writeParam: 1})

    await writePromise

    assert.isTrue(@consistentState.isReading())
    assert.isFalse(@consistentState.isWriting())
    assert.isTrue(@consistentState.isInProgress())
    assert.deepEqual(@consistentState.getState(), {writeParam: 1})

    @getterPromised.resolve(@getterResult)
    await loadPromise

    assert.isFalse(@consistentState.isReading())
    assert.isFalse(@consistentState.isWriting())
    assert.isFalse(@consistentState.isInProgress())
    assert.deepEqual(@consistentState.getState(), {getterParam: 1, writeParam: 1})
    sinon.assert.calledOnce(@getterSpy)
    sinon.assert.calledOnce(@setterSpy)

  it "add writing several times while the first writing is in progress - it will postpone state", ->
    writePromise1 = @consistentState.write({param1: 1})
    @consistentState.write({param2: 2})
    writePromise3 = @consistentState.write({param2: 3, param3: 3})

    sinon.assert.calledOnce(@setterSpy)
    sinon.assert.calledWith(@setterSpy, {param1: 1})
    assert.isTrue(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {param1: 1})
    assert.deepEqual(@consistentState.actualRemoteState, {});
    assert.deepEqual(@consistentState.paramsListToSave, ['param1']);
    assert.deepEqual(@consistentState.nextWritePartialState, {param2: 3, param3: 3});

    @setterPromised.resolve()
    @setterPromised = new Promised()
    await writePromise1

    sinon.assert.calledTwice(@setterSpy)
    sinon.assert.calledWith(@setterSpy.getCall(1), {param2: 3, param3: 3})
    assert.isTrue(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {param1: 1, param2: 3, param3: 3})
    assert.deepEqual(@consistentState.actualRemoteState, {param1: 1});
    assert.deepEqual(@consistentState.paramsListToSave, ['param2', 'param3']);
    assert.isUndefined(@consistentState.nextWritePartialState)

    @setterPromised.resolve()
    await writePromise3

    sinon.assert.calledTwice(@setterSpy)
    assert.deepEqual(@consistentState.getState(), {param1: 1, param2: 3, param3: 3})
    assert.isFalse(@consistentState.isWriting())
    assert.deepEqual(@consistentState.getState(), {param1: 1, param2: 3, param3: 3})
    assert.isUndefined(@consistentState.actualRemoteState);
    assert.isUndefined(@consistentState.paramsListToSave);
    assert.isUndefined(@consistentState.nextWritePartialState);

  it "clear state on error while writing - restore state", ->
    loadPromise = @consistentState.load()
    @consistentState.write({param1: 1})
      .catch(() =>)
    writePromise = @consistentState.write({param2: 2})

    assert.deepEqual(@consistentState.getState(), {param1: 1, param2: 2})

    @getterPromised.resolve(@getterResult)
    await loadPromise

    assert.deepEqual(@consistentState.getState(), {getterParam: 1, param1: 1, param2: 2})

    # reject
    @setterPromised.reject('err')

    try
      await writePromise
    catch err
      assert.deepEqual(@consistentState.getState(), {getterParam: 1, param1: undefined, param2: undefined})
      assert.isFalse(@consistentState.isInProgress());
      assert.isUndefined(@consistentState.actualRemoteState);
      assert.isUndefined(@consistentState.paramsListToSave);
      assert.isUndefined(@consistentState.nextWritePartialState);

      sinon.assert.calledOnce(@setterSpy)

      return

    throw new Error('Setter has to be rejected')

  it "first write is failed and second won't be called", ->
    writePromise1 = @consistentState.write({param1: 1})
    writePromise2 = @consistentState.write({param1: 2, param2: 2})

    @setterPromised.reject('err')
    @setterPromised = new Promised()

    assert.deepEqual(@consistentState.getState(), {param1: 1})

    try
      await writePromise1
    catch err
      assert.isRejected(writePromise2)
      sinon.assert.calledOnce(@setterSpy)
      assert.isFalse(@consistentState.isInProgress())
      assert.deepEqual(@consistentState.getState(), {param1: undefined})

      return

    throw new Error('Setter has to be rejected')

  it "first write is OK and second failed - revert state to first saved step", ->
    writePromise1 = @consistentState.write({param1: 1})
    writePromise2 = @consistentState.write({param1: 2, param2: 2})

    @setterPromised.resolve()
    @setterPromised = new Promised()
    await writePromise1

    @setterPromised.reject('err')

    try
      await writePromise2
    catch err
      sinon.assert.calledTwice(@setterSpy)
      assert.deepEqual(@consistentState.getState(), {param1: 1, param2: undefined})
      assert.isUndefined(@consistentState.actualRemoteState);
      assert.isUndefined(@consistentState.paramsListToSave);
      assert.isUndefined(@consistentState.nextWritePartialState);

      return

    throw new Error('Setter has to be rejected')

  it "after failed load the next saving will run", ->
    loadPromise = @consistentState.load()
    writePromise = @consistentState.write({param: 1})

    @getterPromised.reject('err')
    assert.isRejected(loadPromise)

    @setterPromised.resolve()
    await writePromise

    sinon.assert.calledOnce(@setterSpy)
    assert.deepEqual(@consistentState.getState(), {param: 1})

  it "setIncomeState - just set", ->
    @consistentState.setIncomeState({param: 1})

    assert.deepEqual(@consistentState.getState(), {param: 1})

  it "setIncomeState - while reading - do nothing", ->
    @consistentState.isReading = () => true

    @consistentState.setIncomeState({param: 1})

    assert.deepEqual(@consistentState.getState(), {})

  it "setIncomeState - while writing - carefully update state", ->
#    @stateObj = { actualParam: 1, savingParam: 2 }
#    @consistentState.actualRemoteState = {
#      actualParam: 1
#    }
#    @consistentState.paramsListToSave = ['savingParam']

    writePromise = @consistentState.write({param: 1})

    @consistentState.setIncomeState({newParam: 3, actualParam: 3, savingParam: 3})

    @setterPromised.resolve()
    await writePromise

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
    assert.isUndefined(@consistentState.nextWritePartialState)

  it "restorePreviousState", ->
    @consistentState.actualRemoteState = { param1: 1 }
    @consistentState.paramsListToSave = ['param1', 'param2']
    assert.deepEqual(@consistentState.restorePreviousState(), {
      param1: 1
      param2: undefined
    })

  it "generateSafeNewState", ->
    @stateObj = {
      param1: 1
      param2: 1
      param3: 1
    }
    @stateWhichRead = {
      param1: 2
      param2: 2
      param3: 2
    }
    @consistentState.paramsListToSave = ['param2', 'param3']

    assert.deepEqual(@consistentState.generateSafeNewState(@stateWhichRead), {
      param1: 2
      param2: 1
      param3: 1
    })
