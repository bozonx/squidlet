MessengerModule = rewire('../src/messenger/Messenger.ts')
Messenger = MessengerModule.default


describe 'app.Messenger', ->
  beforeEach ->
    @routerSubscribeHanler = undefined

    @app = {
      host: {
        id: 'master'
      }
    }

    @to = 'room1.host1'

    generateUniqIdMock = () -> 'uniqId'
    MessengerModule.__set__('helpers.generateUniqId', generateUniqIdMock);
    @messenger = new Messenger(@app);
    @messenger.router = {
      send: sinon.stub().returns(Promise.resolve())
      listenIncome: (handler) => @routerSubscribeHanler = handler
      off: sinon.spy()
    }

  it 'publish', ->
    await @messenger.publish(@to, 'deviceCallAction', 'room1.device1', { data: 'value' })

    sinon.assert.calledWith(@messenger.router.send, @to, {
      category: 'deviceCallAction'
      topic: 'room1.device1'
      from: 'master'
      to: @to
      payload: { data: 'value' }
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
    assert.equal(@routerSubscribeHanler, subscriber)
    assert.deepEqual(_.keys(@messenger['subscribers']), [])

  it 'request - check message', ->
    @messenger.request(@to, 'deviceCallAction', 'room1.device1', { data: 'value' })

    sentMessage = {
      category: 'deviceCallAction',
      from: 'master',
      payload: { data: 'value' },
      to: @to,
      topic: 'room1.device1'
      request: {
        id: 'uniqId'
        isRequest: true
      }
    }

    sinon.assert.calledWith(@messenger.router.send, @to, sentMessage)

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

  it 'response', ->
    @app.host.id = @to

    request = {
      category: 'cat'
      topic: 'topic'
      from: 'master'
      to: @to
      request: {
        id: 1
        isRequest: true
      }
    }

    @messenger.response(request, 'payload')

    sinon.assert.calledWith(@messenger.router.send, 'master', {
      category: 'cat'
      error: undefined
      payload: 'payload'
      request: { id: 1, isResponse: true }
      from: @to
      to: 'master'
      topic: 'topic'
    })
