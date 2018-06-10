BridgeSubscriber = require('../../src/messenger/BridgeSubscriber').default


describe.only 'app.BridgeSubscriber', ->
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

    sinon.assert.calledWith(@system.network.send, @toHost, {
      category: 'system'
      topic: 'subscribeToRemoteEvent'
      from: 'master'
      to: 'remoteHost'
      payload: '123'
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

  # TODO: unsubscribe
