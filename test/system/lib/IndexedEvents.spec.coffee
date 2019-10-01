Events = require('../../../system/lib/IndexedEvents').default;


describe.only 'system.lib.IndexedEvents', ->
  beforeEach ->
    @handler = sinon.spy()
    @events = new Events()

  it "addListener and emit", ->
    @events.addListener(@handler)
    @events.emit(1)
    @events.emit(1)

    sinon.assert.calledTwice(@handler)
    sinon.assert.calledWith(@handler, 1)

  it "once", ->
    @events.once(@handler)
    @events.emit()
    @events.emit()

    sinon.assert.calledOnce(@handler)

  it "emitSync", ->
    @events.addListener(() => Promise.resolve(1))
    @events.addListener(() => Promise.resolve(2))

    assert.deepEqual(await @events.emitSync(), [1, 2])

  it "removeListener", ->
    handler2 = sinon.spy()
    index = @events.addListener(@handler)
    @events.addListener(handler2)
    @events.removeListener(index)
    @events.emit()

    sinon.assert.notCalled(@handler)
    sinon.assert.calledOnce(handler2)

  it "removeAll", ->
    handler2 = sinon.spy()
    @events.addListener(@handler)
    @events.addListener(handler2)
    @events.removeAll()
    @events.emit()

    sinon.assert.notCalled(@handler)
    sinon.assert.notCalled(handler2)

  it "getListeners", ->
    @events.addListener(@handler)

    assert.deepEqual(@events.getListeners(), [@handler])

  it "hasListeners", ->
    assert.isFalse(@events.hasListeners())

    @events.addListener(@handler)

    assert.isTrue(@events.hasListeners())
