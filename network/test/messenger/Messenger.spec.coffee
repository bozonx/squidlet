Messenger = require('../../plugin-bridge/messenger/Messenger.ts').default


describe 'app.Messenger', ->
  beforeEach ->
    @routerSubscribeHanler = undefined
    @system = {
      host: {
        id: 'master'
      }
      network: {
        hostId: 'master'
        send: sinon.spy()
      }
      events: {
        addListener: sinon.spy()
        addCategoryListener: sinon.spy()
        removeListener: sinon.spy()
        removeCategoryListener: sinon.spy()
        emit: sinon.spy()
      }
    }
    @to = 'host1'
    @category = 'category'
    @topic = 'deviceCallAction'
    @messenger = new Messenger(@system);
    @messenger.network = {
      send: sinon.stub().returns(Promise.resolve())
      listenIncome: (handler) => @routerSubscribeHanler = handler
    }

  it 'subscribe  to remote', ->
    @messenger.bridgeSubscriber.subscribe = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribe(@to, @category, @topic, handler)

    sinon.assert.calledWith(@messenger.bridgeSubscriber.subscribe, @to, @category, @topic)
    sinon.assert.notCalled(@system.events.addListener)

  it 'subscribe  to local', ->
    @messenger.bridgeSubscriber.subscribe = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribe('master', @category, @topic, handler)

    sinon.assert.calledWith(@system.events.addListener, @category, @topic)
    sinon.assert.notCalled(@messenger.bridgeSubscriber.subscribe)

  it 'unsubscribe from remote', ->
    @messenger.bridgeSubscriber.subscribe = sinon.spy()
    @messenger.bridgeSubscriber.unsubscribe = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribe(@to, @category, @topic, handler)
    @messenger.unsubscribe(@to, @category, @topic, handler)

    sinon.assert.calledWith(@messenger.bridgeSubscriber.subscribe, @to, @category, @topic)
    sinon.assert.notCalled(@system.events.removeListener)
    assert.deepEqual(@messenger.handlerWrappers.handlers, [])

  it 'unsubscribe from local', ->
    @messenger.bridgeSubscriber.subscribe = sinon.spy()
    @messenger.bridgeSubscriber.unsubscribe = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribe('master', @category, @topic, handler)
    @messenger.unsubscribe('master', @category, @topic, handler)

    sinon.assert.calledWith(@system.events.removeListener, @category, @topic)
    sinon.assert.notCalled(@messenger.bridgeSubscriber.subscribe)
    assert.deepEqual(@messenger.handlerWrappers.handlers, [])


  it 'subscribeCategory  to remote', ->
    @messenger.bridgeSubscriber.subscribeCategory = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribeCategory(@to, @category, handler)

    sinon.assert.calledWith(@messenger.bridgeSubscriber.subscribeCategory, @to, @category)
    sinon.assert.notCalled(@system.events.addCategoryListener)

  it 'subscribeCategory  to local', ->
    @messenger.bridgeSubscriber.subscribeCategory = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribeCategory('master', @category, handler)

    sinon.assert.calledWith(@system.events.addCategoryListener, @category)
    sinon.assert.notCalled(@messenger.bridgeSubscriber.subscribeCategory)

  it 'unsubscribeCategory from remote', ->
    @messenger.bridgeSubscriber.subscribeCategory = sinon.spy()
    @messenger.bridgeSubscriber.unsubscribeCategory = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribeCategory(@to, @category, handler)
    @messenger.unsubscribeCategory(@to, @category, handler)

    sinon.assert.calledWith(@messenger.bridgeSubscriber.subscribeCategory, @to, @category)
    sinon.assert.notCalled(@system.events.removeCategoryListener)
    assert.deepEqual(@messenger.handlerWrappers.handlers, [])

  it 'unsubscribeCategory from local', ->
    @messenger.bridgeSubscriber.subscribeCategory = sinon.spy()
    @messenger.bridgeSubscriber.unsubscribeCategory = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribeCategory('master', @category, handler)
    @messenger.unsubscribeCategory('master', @category, handler)

    sinon.assert.calledWith(@system.events.removeCategoryListener, @category)
    sinon.assert.notCalled(@messenger.bridgeSubscriber.subscribeCategory)
    assert.deepEqual(@messenger.handlerWrappers.handlers, [])


  it '$sendMessage', ->
    message = {
      category: @category
      topic: @topic
      from: 'master'
      to: @to
      payload: @payload
    }

    await @messenger.$sendMessage(message)

    sinon.assert.notCalled(@system.events.emit)
    sinon.assert.calledWith(@system.network.send, @to, message)

  it '$sendMessage to local', ->
    message = {
      category: @category
      topic: @topic
      from: 'master'
      to: 'master'
      payload: @payload
    }

    await @messenger.$sendMessage(message)

    sinon.assert.calledWith(@system.events.emit, @category, @topic, message)
    sinon.assert.notCalled(@system.network.send)
