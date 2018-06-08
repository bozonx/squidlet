Router = require('../../src/network/Router').default


describe 'app.Router', ->
  beforeEach ->
    @app = {
      host: {
        id: 'currentHost'
        config: {
          host: {
            routedMessageTTL: 100
          }
          routes: {
            'destHost': [ 'currentHost', 'nextHost', 'destHost' ]
          }
          neighbors: {
            nextHost: {
              type: 'i2c'
              bus: '1'
              address: '5a'
            }
          }
        }
      }
    }

    @destinationsSubscribeHanler = undefined
    @destinations = {
      send: sinon.stub().returns(Promise.resolve())
      listenIncome: (handler) => @destinationsSubscribeHanler = handler
    }

    @router = new Router(@app)
    @router.destinations = @destinations

  it 'send', ->
    await @router.send('destHost', 'payload')

    sinon.assert.calledWith(@destinations.send,
      @app.host.config.neighbors.nextHost,
      {
        payload: 'payload'
        route: ['currentHost', 'nextHost', 'destHost']
        ttl: 100
      }
    )

  it 'listenIncome and handleIncomeMessages', ->
    @app.host.id = 'destHost'
    routerMessage = {
      payload: 'payload'
      route: ['currentHost', 'nextHost', 'destHost']
      ttl: 100
    }
    handler = sinon.spy()
    @router.listenIncome(handler)

    @router.handleIncomeMessages(routerMessage)

    sinon.assert.calledWith(handler, 'payload')

  it 'handleIncomeMessages - forward to next host', ->
    @app.host.id = 'currentHost'
    routerMessage = {
      payload: 'payload'
      route: ['currentHost', 'nextHost', 'destHost']
      ttl: 10
    }
    handler = sinon.spy()
    @router.listenIncome(handler)
    @router.handleIncomeMessages(routerMessage)

    sinon.assert.notCalled(handler)
    sinon.assert.calledWith(@destinations.send,
      @app.host.config.neighbors.nextHost,
      {
        payload: 'payload'
        route: ['currentHost', 'nextHost', 'destHost']
        ttl: 9
      }
    )

  it 'private resolveNextHostId', ->
    @app.host.id = 'currentHost'
    route = [ 'fromHost', 'currentHost', 'nextHost' ]

    assert.equal(@router.resolveNextHostId(route), 'nextHost')

    # TODO: test fail situations
