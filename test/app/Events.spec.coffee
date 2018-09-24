Events = require('../../host/src/app/Events').default


describe.only 'app.Events', ->
  beforeEach ->
    @events = new Events()

  it 'addListener, emit, removeListener', ->
    handler = sinon.spy()
    @events.addListener('cat', 'topic', handler)

    @events.emit('cat', 'topic', 'payload')
    @events.removeListener('cat', 'topic', handler)
    @events.emit('cat', 'topic', 'payload2')

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, 'payload')

  it 'listenCategory', ->
    handler = sinon.spy()
    @events.listenCategory('cat', handler)

    @events.emit('cat', 'topic', 'payload')
    @events.removeCategoryListener('cat', handler)
    @events.emit('cat', 'topic', 'payload2')

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, 'payload')
