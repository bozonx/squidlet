Messenger = require('../../src/app/Messenger').default


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
        publish: sinon.spy()
        subscribe: (handler) => @routerSubscribeHanler = handler
        unsubscribe: sinon.spy()
      }
    }

    @to = {
      host: 'room1.host1'
      type: 'i2c'
      bus: '1'
      address: '5A'
    }

    @messenger = new Messenger(@app);

  it 'publish', ->
    await @messenger.publish(@to, 'deviceCallAction', 'room1.device1', { data: 'value' })

    sinon.assert.calledWith(@app.router.publish, {
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

    assert.deepEqual(_.keys(@messenger['_subscribers']), [ 'cat|topic1', 'cat|topic2' ])

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
    subscriber = @messenger['_subscribers']['cat|topic']

    @messenger.unsubscribe('cat', 'topic', handler)

    @routerSubscribeHanler({ category: 'cat', topic: 'topic' })

    sinon.assert.notCalled(handler)
    sinon.assert.calledWith(@app.router.unsubscribe, subscriber)
    assert.deepEqual(_.keys(@messenger['_subscribers']), [])

  it 'request', ->

