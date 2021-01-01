Events = require('../../../system/lib/IndexedEventEmitter').default;
Promised = require('../../../system/lib/Promised').default;


describe 'system.lib.IndexedEventEmitter', ->
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

  it "once several", ->
    @events.once(@eventName, @handler)
    @events.once(@eventName, @handler)
    @events.once(@eventName, @handler)

    assert.equal(@events.getListeners(@eventName).length, 3)

    @events.emit(@eventName)

    sinon.assert.calledThrice(@handler)

  it "getListeners", ->
    handler1 = () =>
    handler2 = () =>
    @events.addListener(@eventName, handler1)
    @events.addListener(@eventName, handler2)

    handlers = @events.getListeners(@eventName)

    assert.equal(handlers[0], handler1)
    assert.equal(handlers[1], handler2)

  it "hasListeners", ->
    assert.isFalse(@events.hasListeners(@eventName))

    @events.addListener(@eventName, @handler)

    assert.isTrue(@events.hasListeners(@eventName))

  it "removeListener with eventName", ->
    handler2 = sinon.spy()
    index = @events.addListener(@eventName, @handler)
    @events.addListener(@eventName, handler2)
    @events.removeListener(index, @eventName)
    @events.emit(@eventName)

    sinon.assert.notCalled(@handler)
    sinon.assert.calledOnce(handler2)
    assert.isUndefined(@events.handlers[index])
    assert.equal(@events.indexes[@eventName], 1)

  it "removeListener with eventName - one of several handlers", ->
    handler1 = () =>
    handler3 = () =>
    index1 = @events.addListener(@eventName, handler1)
    index2 = @events.addListener(@eventName, @handler)
    index3 = @events.addListener(@eventName, handler3)

    @events.removeListener(index2, @eventName)

    assert.equal(@events.getListeners(@eventName).length, 2)
    assert.equal(@events.getListeners(@eventName)[0], handler1)
    assert.equal(@events.getListeners(@eventName)[1], handler3)

  it "removeListener without eventName", ->
    handler2 = sinon.spy()
    index = @events.addListener(@eventName, @handler)
    @events.addListener(@eventName, handler2)
    @events.removeListener(index)
    @events.emit(@eventName)

    sinon.assert.notCalled(@handler)
    sinon.assert.calledOnce(handler2)
    assert.isUndefined(@events.handlers[index])
    assert.equal(@events.indexes[@eventName], 1)

  it "removeListener without eventName - one of several handlers", ->
    handler1 = () =>
    handler3 = () =>
    index1 = @events.addListener(@eventName, handler1)
    index2 = @events.addListener(@eventName, @handler)
    index3 = @events.addListener(@eventName, handler3)

    @events.removeListener(index2)

    assert.equal(@events.getListeners(@eventName).length, 2)
    assert.equal(@events.getListeners(@eventName)[0], handler1)
    assert.equal(@events.getListeners(@eventName)[1], handler3)

  it "removeListener with eventName and clean up", ->
    index = @events.addListener(@eventName, @handler)
    @events.removeListener(index, @eventName)

    assert.isUndefined(@events.handlers[index])
    assert.isUndefined(@events.indexes[@eventName])

  it "removeListener without eventName and clean up", ->
    index = @events.addListener(@eventName, @handler)
    @events.removeListener(index)

    assert.isUndefined(@events.handlers[index])
    assert.isUndefined(@events.indexes[@eventName])

  it "removeAllListeners", ->
    handler2 = sinon.spy()
    @events.addListener(@eventName, @handler)
    @events.addListener(@eventName, handler2)
    @events.removeAllListeners(@eventName)
    @events.emit(@eventName)

    sinon.assert.notCalled(@handler)
    sinon.assert.notCalled(handler2)
    assert.isUndefined(@events.indexes[@eventName])

  it 'destroy', ->
    @events.addListener(@eventName, sinon.spy())

    @events.destroy()

    assert.isUndefined(@events.handlers)
    assert.isUndefined(@events.indexes)
