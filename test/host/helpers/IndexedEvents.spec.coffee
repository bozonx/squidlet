Events = require('../../../host/helpers/IndexedEvents').default;


describe.only 'helpers.IndexedEvents', ->
  beforeEach ->
    @handler = sinon.spy()
    @events = new Events()

  it "addListener and emit", ->
    @events.addListener(@handler)
    @events.emit(1)

    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, 1)

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

