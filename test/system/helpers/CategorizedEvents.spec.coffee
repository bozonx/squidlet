CategorizedEvents = require('../../../system/helpers/CategorizedEvents').default


describe 'system.helpers.CategorizedEvents', ->
  beforeEach ->
    @events = new CategorizedEvents('|')

  it 'addListener, emit, removeListener', ->
    handler = sinon.spy()
    handlerIndex = @events.addListener('cat', 'topic', handler)

    @events.emit('cat', 'topic', 'payload')
    @events.removeListener('cat', 'topic', handlerIndex)
    @events.emit('cat', 'topic', 'payload2')

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, 'payload')

  it 'addCategoryListener', ->
    handler = sinon.spy()
    handlerIndex = @events.addCategoryListener('cat', handler)

    @events.emit('cat', 'topic', 'payload')
    @events.removeCategoryListener('cat', handlerIndex)
    @events.emit('cat', 'topic', 'payload2')

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, 'payload')

  it 'don\t listen other events', ->
    handler = sinon.spy()
    @events.addListener('cat', 'topic', handler)

    @events.emit('cat', 'otherTopic', 'payload')

    sinon.assert.notCalled(handler)

  it 'don\t listen other category', ->
    handler = sinon.spy()
    @events.addCategoryListener('cat', handler)

    @events.emit('otherCat', 'payload')

    sinon.assert.notCalled(handler)

  it 'removeAllListeners', ->
    @events.addListener('cat', 'topic', sinon.spy())
    @events.addListener('cat', 'topic', sinon.spy())

    @events.removeAllListeners('cat', 'topic')

    assert.deepEqual(@events.eventEmitter.indexedEvents, {})

  it 'destroy', ->
    @events.addCategoryListener('cat', sinon.spy())
    @events.addCategoryListener('cat', sinon.spy())

    @events.destroy()

    assert.deepEqual(@events.eventEmitter.indexedEvents, {})
