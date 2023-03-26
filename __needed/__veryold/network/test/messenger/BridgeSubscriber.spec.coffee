BridgeSubscriber = require('../../plugin-bridge/messenger/BridgeSubscriber').default


describe 'messenger.BridgeSubscriber', ->
  beforeEach ->
    @toHost = 'remoteHost'
    @category = 'cat'
    @topic = 'topic'
    @incomeHandler = null
    @system = {
      host: {
        generateUniqId: -> '123'
      }
      network: {
        hostId: 'master'
        send: sinon.stub().returns(Promise.resolve())
      }
      events: {
        addCategoryListener: (category, handler) => @incomeHandler = handler
      }
    }

    @bridgeSubscriber = new BridgeSubscriber(@system)

  it 'subscribe', ->
    handler = ->
    @bridgeSubscriber.subscribe(@toHost, @category, @topic, handler)

    assert.deepEqual(@bridgeSubscriber.handlers['cat|topic|remoteHost'], [
      [
        '123'
        handler
      ]
    ])
    sinon.assert.calledWith(@system.network.send, @toHost, {
      category: 'messengerBridge'
      topic: 'subscribeToRemoteEvent'
      from: 'master'
      to: 'remoteHost'
      payload: {
        category: 'cat'
        topic: 'topic'
        handlerId: '123'
      }
    })

  it 'subscribeCategory', ->
    handler = ->
    @bridgeSubscriber.subscribeCategory(@toHost, @category, handler)

    assert.deepEqual(@bridgeSubscriber.handlers['cat|*|remoteHost'], [
      [
        '123'
        handler
      ]
    ])
    sinon.assert.calledWith(@system.network.send, @toHost, {
      category: 'messengerBridge'
      topic: 'subscribeToRemoteCategoryEvent'
      from: 'master'
      to: 'remoteHost'
      payload: {
        category: 'cat'
        topic: '*'
        handlerId: '123'
      }
    })

  it 'unsubscribe', ->
    handlerToRemove = ->
    otherHandler = ->
    @bridgeSubscriber.handlers['cat|topic|remoteHost'] = [
      [
        '123'
        handlerToRemove,
      ]
      [
        '345'
        otherHandler,
      ]
    ]

    @bridgeSubscriber.unsubscribe(@toHost, @category, @topic, handlerToRemove)

    assert.deepEqual(@bridgeSubscriber.handlers, {
      'cat|topic|remoteHost': [
        [
          '345'
          otherHandler,
        ]
      ]
    })

    sinon.assert.calledWith(@system.network.send, @toHost, {
      category: 'messengerBridge'
      topic: 'unsubscribeFromRemoteEvent'
      from: 'master'
      to: 'remoteHost'
      payload: {
        category: 'cat'
        topic: 'topic'
        handlerId: '123'
      }
    })

  it 'unsubscribeCategory', ->
    handlerToRemove = ->
    otherHandler = ->
    @bridgeSubscriber.handlers['cat|*|remoteHost'] = [
      [
        '123'
        handlerToRemove,
      ]
      [
        '345'
        otherHandler,
      ]
    ]

    @bridgeSubscriber.unsubscribeCategory(@toHost, @category, handlerToRemove)

    assert.deepEqual(@bridgeSubscriber.handlers, {
      'cat|*|remoteHost': [
        [
          '345'
          otherHandler,
        ]
      ]
    })

    sinon.assert.calledWith(@system.network.send, @toHost, {
      category: 'messengerBridge'
      topic: 'unsubscribeFromRemoteCategoryEvent'
      from: 'master'
      to: 'remoteHost'
      payload: {
        category: 'cat'
        topic: '*'
        handlerId: '123'
      }
    })

  it 'income respond', ->
    msgPayload = {
      category: 'cat'
      topic: 'topic'
      handlerId: '123'
      payload: 'payload'
    }

    @respondMessage = {
      category: 'messengerBridge'
      topic: 'respondOfRemoteEvent'
      from: 'remoteHost'
      to: 'master'
      payload: msgPayload
    }
    handler = sinon.spy()
    @bridgeSubscriber.handlers = {
      'cat|topic|remoteHost': [
        [
          @handlerId
          handler
        ]
      ]
    }
    @bridgeSubscriber.init()

    @incomeHandler(@respondMessage)

    sinon.assert.calledWith(handler, msgPayload)
