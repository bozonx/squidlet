Messenger = require('../../host/src/messenger/Messenger.ts').default


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
        removeListener: sinon.spy()
        emit: sinon.spy()
      }
    }
    @to = 'room1.host1'
    @topic = 'deviceCallAction'
    @messenger = new Messenger(@system);
    @messenger.network = {
      send: sinon.stub().returns(Promise.resolve())
      listenIncome: (handler) => @routerSubscribeHanler = handler
    }

  it 'publish', ->
    message = {
      category: 'publish'
      topic: @topic
      from: 'master'
      to: @to
      payload: { deviceId: 'room1.device1' }
    }

    await @messenger.publish(@to, @topic, { deviceId: 'room1.device1' })

    sinon.assert.notCalled(@system.events.emit)
    sinon.assert.calledWith(@system.network.send, @to, message)

  it 'publish to local', ->
    message = {
      category: 'publish'
      topic: @topic
      from: 'master'
      to: 'master'
      payload: { deviceId: 'room1.device1' }
    }

    await @messenger.publish('master', @topic, { deviceId: 'room1.device1' })

    sinon.assert.calledWith(@system.events.emit, 'publish', @topic, message)
    sinon.assert.notCalled(@system.network.send)

  it 'subscribe  to remote', ->
    @messenger.bridgeSubscriber.subscribe = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribe(@to, @topic, handler)

    sinon.assert.calledWith(@messenger.bridgeSubscriber.subscribe, @to, 'publish', @topic)
    sinon.assert.notCalled(@system.events.addListener)

  it 'subscribe  to local', ->
    @messenger.bridgeSubscriber.subscribe = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribe('master', @topic, handler)

    sinon.assert.calledWith(@system.events.addListener, 'publish', @topic)
    sinon.assert.notCalled(@messenger.bridgeSubscriber.subscribe)

  it 'unsubscribe from remote', ->
    @messenger.bridgeSubscriber.subscribe = sinon.spy()
    @messenger.bridgeSubscriber.unsubscribe = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribe(@to, @topic, handler)
    @messenger.unsubscribe(@to, @topic, handler)

    sinon.assert.calledWith(@messenger.bridgeSubscriber.subscribe, @to, 'publish', @topic)
    sinon.assert.notCalled(@system.events.removeListener)
    assert.deepEqual(@messenger.handlerWrappers.handlers, [])

  it 'unsubscribe from local', ->
    @messenger.bridgeSubscriber.subscribe = sinon.spy()
    @messenger.bridgeSubscriber.unsubscribe = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribe('master', @topic, handler)
    @messenger.unsubscribe('master', @topic, handler)

    sinon.assert.calledWith(@system.events.removeListener, 'publish', @topic)
    sinon.assert.notCalled(@messenger.bridgeSubscriber.subscribe)
    assert.deepEqual(@messenger.handlerWrappers.handlers, [])
