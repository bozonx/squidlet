MessengerModule = rewire('../src/app/Messenger.ts')
Messenger = MessengerModule.default


describe 'app.Messenger', ->
  beforeEach ->
    @routerSubscribeHanler = undefined

    @app = {
      host: {
        generateDestination: (type, bus) ->
          {
            host: 'master'
            type
            bus
            address: undefined
          }
      }
      router: {
        send: sinon.stub().returns(Promise.resolve())
        listenIncome: (handler) => @routerSubscribeHanler = handler
        off: sinon.spy()
      }
    }

    @to = {
      host: 'room1.host1'
      type: 'i2c'
      bus: '1'
      address: '5A'
    }

    generateUniqIdMock = () -> 'uniqId'
    MessengerModule.__set__('helpers.generateUniqId', generateUniqIdMock);
    @messenger = new Messenger(@app);

  it 'publish', ->
    await @messenger.publish(@to, 'deviceCallAction', 'room1.device1', { data: 'value' })

    sinon.assert.calledWith(@app.router.send, {
      category: 'deviceCallAction',
      from: { address: undefined , bus: '1', host: 'master', type: 'i2c' },
      payload: { data: 'value' },
      to: { address: '5A', bus: '1', host: 'room1.host1', type: 'i2c' },
      topic: 'room1.device1'
    })

  it 'subscribe - add subscribers', ->
    handler11 = sinon.spy()
    handler12 = sinon.spy()
    handler21 = sinon.spy()

    @messenger.subscribe('cat', 'topic1', handler11)
    @messenger.subscribe('cat', 'topic1', handler12)
    @messenger.subscribe('cat', 'topic2', handler21)

    assert.deepEqual(_.keys(@messenger['subscribers']), [ 'cat|topic1', 'cat|topic2' ])

  it 'subscribe - invoke', ->
    handler = sinon.spy()
    handler2 = sinon.spy()
    @messenger.subscribe('cat', 'topic', handler)
    @messenger.subscribe('cat', 'topic', handler2)

    @routerSubscribeHanler({ category: 'cat', topic: 'otherTopic' })
    @routerSubscribeHanler({ category: 'cat', topic: 'topic' })

    sinon.assert.calledOnce(handler)
    sinon.assert.calledOnce(handler2)
    sinon.assert.calledWith(handler, { category: 'cat', topic: 'topic' })

  it 'unsubscribe', ->
    handler = sinon.spy()
    @messenger.subscribe('cat', 'topic', handler)
    subscriber = @messenger['subscribers']['cat|topic']

    @messenger.unsubscribe('cat', 'topic', handler)

    @routerSubscribeHanler({ category: 'cat', topic: 'topic' })

    sinon.assert.notCalled(handler)
    sinon.assert.calledWith(@app.router.listenIncome, subscriber)
    assert.deepEqual(_.keys(@messenger['subscribers']), [])

  it 'request - check message', ->
    @messenger.request(@to, 'deviceCallAction', 'room1.device1', { data: 'value' })

    sentMessage = {
      category: 'deviceCallAction',
      from: { address: undefined , bus: '1', host: 'master', type: 'i2c' },
      payload: { data: 'value' },
      to: { address: '5A', bus: '1', host: 'room1.host1', type: 'i2c' },
      topic: 'room1.device1'
      request: {
        id: 'uniqId'
        isRequest: true
      }
    }

    sinon.assert.calledWith(@app.router.send, sentMessage)

  it 'request - receive response', ->
    promise = @messenger.request(@to, 'deviceCallAction', 'room1.device1', { data: 'value' })

    responseMsg = {
      request: {
        id: 'uniqId'
        isResponse: true
      }
    }

    @routerSubscribeHanler(responseMsg)

    await promise

  it 'listenIncomeRequests', ->
    handler = sinon.spy()
    @messenger.listenIncomeRequests('cat', handler)
    incomeMessage = {
      category: 'cat'
      topic: 'topic'
      request: {
        isRequest: true
      }
    }

    @routerSubscribeHanler(incomeMessage)

    sinon.assert.calledWith(handler, incomeMessage)

  it 'sendResponse', ->
    request = {
      category: 'cat'
      topic: 'topic'
      from: {
        type: 'i2c'
        bus: '1'
      }
      to: {
        type: 'i2c'
        bus: '1'
        address: '5a'
      }
      request: {
        id: 1
        isRequest: true
      }
    }

    @messenger.sendResponse(request, 'payload')

    sinon.assert.calledWith(@app.router.send, {
      category: 'cat',
      error: undefined,
      from: { address: undefined, bus: '1', host: 'master', type: 'i2c' },
      payload: 'payload',
      request: { id: 1, isResponse: true },
      to: { bus: '1', type: 'i2c' },
      topic: 'topic'
    })
