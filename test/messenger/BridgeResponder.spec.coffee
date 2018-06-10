Bridge = require('../../src/messenger/BridgeSubscriber').default


describe 'app.BridgeSubscriber', ->
  beforeEach ->
    @toHost = 'remoteHost'
    @category = 'cat'
    @topic = 'topic'
    @subscribeMessage = {
      category: 'system'
      topic: 'subscribeToRemoteEvent'
      to: 'remoteHost'
      payload: '123'
    }
    @networkIncomeHandler = null
    @system = {
      io: {
        generateUniqId: -> '123'
      }
      network: {
        send: sinon.stub().returns(Promise.resolve())
        listenIncome: (handler) => @networkIncomeHandler = handler
      }
    }

    @bridge = new Bridge(@system)

  it 'subscribe', ->
    handler = sinon.spy()
    @bridge.subscribe(@toHost, @category, @topic, handler)

    sinon.assert.calledWith(@system.network.send, @toHost, @subscribeMessage)

  it 'income message', ->
    @bridge.init()

    @networkIncomeHandler(@networkIncomeHandler)
