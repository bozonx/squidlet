OneWayMessages = require('../../plugin-bridge/messenger/OneWayMessages').default


describe 'messenger.OneWayMessages', ->
  beforeEach ->
    @toHost = 'remoteHost'
    @category = 'category'
    @topic = 'topic'
    @payload = 'payload'
    @incomeHandler = null
    @system = {
      host: {
        id: 'master'
      }
      network: {
        listenIncome: (handler) => @incomeHandler = handler
      }
      events: {
        #addListener: sinon.spy()
        #removeListener: sinon.spy()
        emit: sinon.spy()
      }
    }
    @messenger = {
      $sendMessage: sinon.stub().returns(Promise.resolve())
    }

    @oneWay = new OneWayMessages(@system, @messenger)

  it 'handleIncomeMessages', ->
    messageToSend = {
      category: @category
      topic: @topic
      from: 'otherHost'
      to: 'master'
    }

    @oneWay.init()

    @incomeHandler(null, messageToSend)

    sinon.assert.calledWith(@system.events.emit, @category, @topic, messageToSend)

  it 'emit', ->
    resultMessage = {
      category: @category
      topic: @topic
      from: 'master'
      to: 'master'
      payload: @payload
    }

    await @oneWay.emit(@category, @topic, @payload)

    sinon.assert.calledWith(@system.events.emit, @category, @topic, resultMessage)

  it 'send', ->
    resultMessage = {
      category: @category
      topic: @topic
      from: 'master'
      to: @to
      payload: @payload
    }

    await @oneWay.send(@to, @category, @topic, @payload)

    sinon.assert.calledWith(@messenger.$sendMessage, resultMessage)
