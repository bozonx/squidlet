BridgeSubscriber = require('../../src/messenger/BridgeSubscriber').default


describe 'app.BridgeSubscriber', ->
  beforeEach ->
    @toHost = 'remoteHost'
    @category = 'cat'
    @topic = 'topic'
    @networkIncomeHandler = null
    @system = {
      io: {
        generateUniqId: -> '123'
      }
      network: {
        hostId: 'master'
        send: sinon.stub().returns(Promise.resolve())
        listenIncome: (handler) => @networkIncomeHandler = handler
      }
    }

    @bridgeSubscriber = new BridgeSubscriber(@system)

  it 'subscribe', ->
    handler = ->
    @bridgeSubscriber.subscribe(@toHost, @category, @topic, handler)

    assert.deepEqual(@bridgeSubscriber.handlers['cat|topic|remoteHost'], [
      {
        handler,
        handlerId: '123'
      }
    ])
    sinon.assert.calledWith(@system.network.send, @toHost, {
      category: 'system'
      topic: 'subscribeToRemoteEvent'
      from: 'master'
      to: 'remoteHost'
      payload: {
        category: 'cat'
        topic: 'topic'
        handlerId: '123'
      }
    })

  it 'income respond', ->
    @respondMessage = {
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
    }
    handler = sinon.spy()
    @bridgeSubscriber.handlers = {
      'cat|topic|remoteHost': [
        {
          handlerId: @handlerId
          handler
        }
      ]
    }
    @bridgeSubscriber.init()

    @networkIncomeHandler(@respondMessage)

    sinon.assert.calledWith(handler, 'payload')

  it 'unsubscribe', ->
    handlerToRemove = ->
    otherHandler = ->
    @bridgeSubscriber.handlers['cat|topic|remoteHost'] = [
      {
        handlerId: '123'
        handler: handlerToRemove,
      }
      {
        handlerId: '345'
        handler: otherHandler,
      }
    ]

    @bridgeSubscriber.unsubscribe(@toHost, @category, @topic, handlerToRemove)

    assert.deepEqual(@bridgeSubscriber.handlers, {
      'cat|topic|remoteHost': [
        {
          handlerId: '345'
          handler: otherHandler,
        }
      ]
    })

    sinon.assert.calledWith(@system.network.send, @toHost, {
      category: 'system'
      topic: 'unsubscribeFromRemoteEvent'
      from: 'master'
      to: 'remoteHost'
      payload: {
        category: 'cat'
        topic: 'topic'
        handlerId: '123'
      }
    })
