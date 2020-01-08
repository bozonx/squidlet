BridgeResponder = require('../../plugin-bridge/messenger/BridgeResponder').default


describe 'messenger.BridgeResponder', ->
  beforeEach ->
    @subscriberHost = 'master'
    @category = 'cat'
    @topic = 'topic'
    @incomeHandler = null
    @addLocalHandler = sinon.spy()
    @system = {
      network: {
        hostId: 'remoteHost'
        send: sinon.stub().returns(Promise.resolve())
      }
      events: {
        addCategoryListener: (category, handler) =>
          @incomeHandler = handler

        addListener: (category, topic, handler) =>
          @addLocalHandler(category, topic, handler)

        removeListener: sinon.spy()
      }
    }

    @bridgeResponder = new BridgeResponder(@system)

  it 'receive request to subscribe to event', ->
    @incomeMessage = {
      category: 'messengerBridge'
      topic: 'subscribeToRemoteEvent'
      from: 'master'
      to: 'remoteHost'
      payload: {
        category: 'cat'
        topic: 'topic'
        handlerId: '123'
      }
    }

    @bridgeResponder.init()
    @incomeHandler(@incomeMessage)

    sinon.assert.calledWith(@addLocalHandler, @category, @topic, @bridgeResponder.handlers['123'])

  it 'response', ->
    @bridgeResponder.response('123', @subscriberHost, @category, @topic, 'payload')

    sinon.assert.calledWith(@system.network.send, @subscriberHost, {
      category: 'messengerBridge'
      topic: 'respondOfRemoteEvent'
      from: 'remoteHost'
      to: 'master'
      payload: {
        category: 'cat'
        topic: 'topic'
        handlerId: '123'
        payload: 'payload'
      }
    })

  it 'unsubscribe', ->
    handler = ->
    @bridgeResponder.handlers = {
      '123': handler
    }

    @unsubscribeMessage = {
      category: 'messengerBridge'
      topic: 'unsubscribeFromRemoteEvent'
      from: 'master'
      to: 'remoteHost'
      payload: {
        category: 'cat'
        topic: 'topic'
        handlerId: '123'
      }
    }

    @bridgeResponder.init()
    @incomeHandler(@unsubscribeMessage)

    assert.deepEqual(@bridgeResponder.handlers, {})
    sinon.assert.calledWith(@system.events.removeListener, @category, @topic, handler)
