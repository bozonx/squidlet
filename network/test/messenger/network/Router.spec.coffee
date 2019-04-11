Router = require('../../plugin-bridge/network/Router').default


describe 'app.Router', ->
  beforeEach ->
    @network = {
      hostId: 'currentHost'
      config: {
        connections: [
          {
            type: 'i2c'
            bus: '1'
            address: '5a'
          }
        ]
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
        params: {
          routedMessageTTL: 10
        }
      }
    }
    @drivers = {}

    @destinationsSubscribeHanler = undefined
    @destinations = {
      send: sinon.stub().returns(Promise.resolve())
      listenIncome: (handler) => @destinationsSubscribeHanler = handler
    }

    @router = new Router(@network, @drivers)
    @router.destinations = @destinations

  it 'send', ->
    await @router.send('destHost', 'payload')

    sinon.assert.calledWith(@destinations.send,
      @network.config.neighbors.nextHost,
      {
        payload: 'payload'
        route: ['currentHost', 'nextHost', 'destHost']
        ttl: 10
      }
    )

  it 'listenIncome and handleIncomeMessages', ->
    @network.hostId = 'destHost'
    routerMessage = {
      payload: 'payload'
      route: ['currentHost', 'nextHost', 'destHost']
      ttl: 10
    }
    handler = sinon.spy()
    @router.listenIncome(handler)

    @router.handleIncomeMessages(null, routerMessage)

    sinon.assert.calledWith(handler, null, 'payload')

  it 'handleIncomeMessages - forward to next host', ->
    @network.hostId = 'currentHost'
    routerMessage = {
      payload: 'payload'
      route: ['currentHost', 'nextHost', 'destHost']
      ttl: 10
    }
    handler = sinon.spy()
    @router.listenIncome(handler)
    @router.handleIncomeMessages(null, routerMessage)

    sinon.assert.notCalled(handler)
    sinon.assert.calledWith(@destinations.send,
      @network.config.neighbors.nextHost,
      {
        payload: 'payload'
        route: ['currentHost', 'nextHost', 'destHost']
        ttl: 9
      }
    )

  it 'private resolveNextHostId', ->
    @network.hostId = 'currentHost'
    route = [ 'fromHost', 'currentHost', 'nextHost' ]

    assert.equal(@router.resolveNextHostId(route), 'nextHost')

    # TODO: test fail situations
