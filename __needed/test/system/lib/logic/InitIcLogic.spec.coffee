InitIcLogic = require('../../../../system/lib/logic/InitIcLogic').default;
Promised = require('../../../../../../squidlet-lib/src/Promised').default;


describe 'system.lib.InitIcLogic', ->
  beforeEach ->
    @initCbPromised = new Promised()
    @initSpy = sinon.spy()
    @initCb = () =>
      @initSpy()
      return @initCbPromised.promise
    @minIntervalSec = 1
    @logic = new InitIcLogic(@initCb, () => , @minIntervalSec)

  it "init - success", ->
    assert.isTrue(@logic.isSetupStep)
    assert.isFalse(@logic.isInitIcStep)
    assert.isFalse(@logic.wasInitialized)

    @logic.init()

    sinon.assert.calledOnce(@initSpy)
    assert.isFalse(@logic.isSetupStep)
    assert.isTrue(@logic.isInitIcStep)
    assert.isFalse(@logic.wasInitialized)

    @initCbPromised.resolve()

    #assert.isFulfilled(@logic.initPromise)

    await @logic.initPromise

    assert.isFalse(@logic.isSetupStep)
    assert.isFalse(@logic.isInitIcStep)
    assert.isTrue(@logic.wasInitialized)
    sinon.assert.calledOnce(@initSpy)

  it "init - error and after that success. Cb will be rejected before timeout", ->
    clock = sinon.useFakeTimers()

    @logic.init()

    firstPromise = @initCbPromised.promise

    @initCbPromised.reject('e')
    @initCbPromised = new Promised()
    sinon.assert.calledOnce(@initSpy)

    # wait timeout
    clock.tick(@minIntervalSec * 1000)

    assert.isFalse(@logic.isSetupStep)
    assert.isTrue(@logic.isInitIcStep)
    assert.isFalse(@logic.wasInitialized)

    try
      await firstPromise

    sinon.assert.calledTwice(@initSpy)

    # resolve next try
    @initCbPromised.resolve()

    await @logic.initPromise

    sinon.assert.calledTwice(@initSpy)

    clock.restore()

  it "init - error and after that success. Cb will be rejected after timeout", ->
    clock = sinon.useFakeTimers()

    @logic.init()

    # wait timeout
    clock.tick(@minIntervalSec * 1000)

    sinon.assert.calledOnce(@initSpy)

    firstPromise = @initCbPromised.promise
    @initCbPromised.reject('e')
    @initCbPromised = new Promised()

    try
      await firstPromise

    sinon.assert.calledTwice(@initSpy)

    @initCbPromised.resolve()

    await @logic.initPromise

    sinon.assert.calledTwice(@initSpy)

    clock.restore()

  it "init - error and after that success. Cb will be rejected after timeout", ->
    @logic.init()

    assert.throws(() => @logic.init())

    @initCbPromised.resolve()

  it "cancel", ->
    @logic.init()

    @logic.cancel()

    assert.isTrue(@logic.isSetupStep)
    assert.isFalse(@logic.isInitIcStep)
    assert.isFalse(@logic.wasInitialized)

  it "destroy", ->
    @logic.destroy()

    assert.isUndefined(@logic.timeoutPromised)
    assert.isUndefined(@logic.timeoutOfTry)
    assert.isUndefined(@logic.initIcPromised)
