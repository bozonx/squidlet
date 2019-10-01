Events = require('../../../system/lib/IndexedEventEmitter').default;
Promised = require('../../../system/lib/Promised').default;


describe.only 'system.lib.IndexedEventEmitter', ->
  beforeEach ->
    @eventName = 'name'
    @handler = sinon.spy()
    @events = new Events()

  it "addListener and emit", ->
    @events.addListener(@eventName, @handler)
    @events.emit(@eventName, 1)
    @events.emit('otherName', 2)

    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, 1)

  it "ordered indexes", ->
    @events.addListener(@eventName, @handler)
    index = @events.addListener('otherName', @handler)

    assert.equal(index, 1)

  it "emitSync", ->
    handler1 = sinon.stub().returns(Promise.resolve())
    promised = new Promised();
    handler2 = sinon.stub().returns(promised.promise)

    @events.addListener(@eventName, handler1)
    @events.addListener(@eventName, handler2)

    resultPromise = @events.emitSync(@eventName, 1);

    promised.resolve()

    await resultPromise

    sinon.assert.calledOnce(handler1)
    sinon.assert.calledWith(handler1, 1)
    sinon.assert.calledOnce(handler2)
    sinon.assert.calledWith(handler2, 1)

  it "once", ->
    @events.once(@eventName, @handler)
    @events.emit(@eventName)
    @events.emit(@eventName)

    sinon.assert.calledOnce(@handler)

  it "getHandlers", ->
    handler1 = () =>
    handler2 = () =>
    @events.addListener(@eventName, handler1)
    @events.addListener(@eventName, handler2)

    handlers = @events.getHandlers(@eventName)

    assert.equal(handlers[0], handler1)
    assert.equal(handlers[1], handler2)

  it "removeListener", ->
    handler2 = sinon.spy()
    index = @events.addListener(@eventName, @handler)
    @events.addListener(@eventName, handler2)
    @events.removeListener(index, @eventName)
    @events.emit(@eventName)

    sinon.assert.notCalled(@handler)
    sinon.assert.calledOnce(handler2)

  it "removeAllListeners", ->
    handler2 = sinon.spy()
    @events.addListener(@eventName, @handler)
    @events.addListener(@eventName, handler2)
    @events.removeAllListeners(@eventName)
    @events.emit(@eventName)

    sinon.assert.notCalled(@handler)
    sinon.assert.notCalled(handler2)

  it 'destroy', ->
    @events.addListener(@eventName, sinon.spy())
    @events.addListener(@eventName, sinon.spy())

    @events.destroy()

    assert.deepEqual(@events.indexedEvents, {})
