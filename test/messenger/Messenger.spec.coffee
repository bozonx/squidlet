Messenger = require('../../src/messenger/Messenger.ts').default


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

  it.only 'unsubscribe from remote', ->
    @messenger.bridgeSubscriber.unsubscribe = sinon.spy()
    handler = sinon.spy()

    @messenger.subscribe(@to, @topic, handler)
    @messenger.unsubscribe(@to, @topic, handler)

    sinon.assert.calledWith(@messenger.bridgeSubscriber.subscribe)
    sinon.assert.notCalled(@system.events.addListener)



#
#  it 'request - check message', ->
#    @messenger.request(@to, 'deviceCallAction', 'room1.device1', { data: 'value' })
#
#    sentMessage = {
#      category: 'deviceCallAction',
#      from: 'master',
#      payload: { data: 'value' },
#      to: @to,
#      topic: 'room1.device1'
#      request: {
#        id: 'uniqId'
#        isRequest: true
#      }
#    }
#
#    sinon.assert.calledWith(@messenger.router.send, @to, sentMessage)

#  it 'request - receive response', ->
#    promise = @messenger.request(@to, 'deviceCallAction', { deviceId: 'room1.device1' })
#
#    responseMsg = {
#      request: {
#        id: 'uniqId'
#        isResponse: true
#      }
#    }
#
#    @routerSubscribeHanler(responseMsg)
#
#    await promise
#
#  it 'listenIncomeRequests', ->
#    handler = sinon.spy()
#    @messenger.listenIncomeRequests('cat', handler)
#    incomeMessage = {
#      category: 'cat'
#      topic: 'topic'
#      request: {
#        isRequest: true
#      }
#    }
#
#    @routerSubscribeHanler(incomeMessage)
#
#    sinon.assert.calledWith(handler, incomeMessage)

#  it 'response', ->
#    @system.host.id = @to
#
#    request = {
#      category: 'cat'
#      topic: 'topic'
#      from: 'master'
#      to: @to
#      request: {
#        id: 1
#        isRequest: true
#      }
#    }
#
#    @messenger.response(request, 'payload')
#
#    sinon.assert.calledWith(@messenger.router.send, 'master', {
#      category: 'cat'
#      error: undefined
#      payload: 'payload'
#      request: { id: 1, isResponse: true }
#      from: @to
#      to: 'master'
#      topic: 'topic'
#    })
