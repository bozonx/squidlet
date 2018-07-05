BridgeResponder = require('../../src/messenger/BridgeResponder').default


describe 'app.BridgeResponder', ->
  beforeEach ->
    @subscriberHost = 'master'
    @category = 'cat'
    @topic = 'topic'
    @networkIncomeHandler = null
    @system = {
      network: {
        hostId: 'remoteHost'
        send: sinon.stub().returns(Promise.resolve())
        listenIncome: (handler) => @networkIncomeHandler = handler
      }
      events: {
        addListener: sinon.spy()
        removeListener: sinon.spy()
      }
    }

    @bridgeResponder = new BridgeResponder(@system)

  it 'receive request to subscribe to event', ->
    @incomeMessage = {
      category: 'system'
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
    @networkIncomeHandler(@incomeMessage)

    sinon.assert.calledWith(@system.events.addListener, @category, @topic, @bridgeResponder.handlers['123'])

  it 'response', ->
    @bridgeResponder.response(@category, @topic, @subscriberHost, '123', 'payload')

    sinon.assert.calledWith(@system.network.send, @subscriberHost, {
      category: 'system'
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
      category: 'system'
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
    @networkIncomeHandler(@unsubscribeMessage)

    assert.deepEqual(@bridgeResponder.handlers, {})
    sinon.assert.calledWith(@system.events.removeListener, @category, @topic, handler)
