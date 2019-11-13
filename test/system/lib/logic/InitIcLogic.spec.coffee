InitIcLogic = require('../../../../system/lib/logic/InitIcLogic').default;
Promised = require('../../../../system/lib/Promised').default;


describe.only 'system.lib.InitIcLogic', ->
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

    @initCbPromised.reject()
    @initCbPromised = new Promised()
    sinon.assert.calledOnce(@initSpy)

    clock.tick(@minIntervalSec * 1000)

    assert.isFalse(@logic.isSetupStep)
    assert.isTrue(@logic.isInitIcStep)
    assert.isFalse(@logic.wasInitialized)

    sinon.assert.calledTwice(@initSpy)

    @initCbPromised.resolve()

    #assert.isResolved(@logic.initPromise)

    await @logic.initPromise

    sinon.assert.calledTwice(@initSpy)

    clock.restore()
