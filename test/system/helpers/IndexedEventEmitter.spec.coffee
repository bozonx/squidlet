Events = require('../../../system/helpers/IndexedEventEmitter').default;


describe 'helpers.IndexedEventEmitter', ->
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

  it "once", ->
    @events.once(@eventName, @handler)
    @events.emit(@eventName)
    @events.emit(@eventName)

    sinon.assert.calledOnce(@handler)

  it "removeListener", ->
    handler2 = sinon.spy()
    index = @events.addListener(@eventName, @handler)
    @events.addListener(@eventName, handler2)
    @events.removeListener(@eventName, index)
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
