Router = require('../../src/messenger/Router').default


describe.only 'app.Router', ->
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
#      config: {
#        devices: {
#          room1: {
#            host: {
#              device1: {
#                device: 'host'
#                address: {
#                  type: 'i2c'
#                  bus: 1
#                  address: '5A'
#                }
#              }
#            }
#          }
#        }
#      }
    }

#    @connectionSubscribeHanler = undefined
#    @connection = {
#      send: sinon.stub().returns(Promise.resolve())
#      listenIncome: (handler) => @connectionSubscribeHanler = handler
#    }

    @destinationsSubscribeHanler = undefined
    @destinations = {
      send: sinon.stub().returns(Promise.resolve())
      listenIncome: (handler) => @destinationsSubscribeHanler = handler
    }

#    @connectionClassConstructor = sinon.spy()
#    connectionClassConstructor = @connectionClassConstructor
#    @connectionClass = class
#      constructor: (params...) -> connectionClassConstructor(params...)
#      test: 'test'
#      init: ->

    @router = new Router(@app)
    @router.destinations = @destinations
    #@router['connectionTypes'].i2c = @connectionClass


  # TODO: !!!!!
#  it 'init', ->
#    @router.init()
#
#    assert.equal(@router['connections']['master-local'].constructor.name, 'LocalConnection')

  it 'send', ->
#    @router.connections = {
#      'i2c-1': @connection
#    }

    await @router.send('destHost', 'payload')

    sinon.assert.calledWith(@destinations.send,
      @app.host.config.neighbors.nextHost,
      {
        payload: 'payload'
        route: ['currentHost', 'nextHost', 'destHost']
        ttl: 100
      }
    )

  it 'send to loop back', ->
    handler = sinon.spy()
    @router.listenIncome(handler)
    await @router.send('currentHost', 'payload')

    sinon.assert.calledWith(handler, 'payload')

  it 'listenIncome to destination host', ->
    @app.host.id = 'destHost'
    routerMessage = {
      payload: 'payload'
      route: ['currentHost', 'nextHost', 'destHost']
      ttl: 100
    }
    @router.connections = {
      'i2c-1': @connection
    }
    @router.listenToAllConnections()
    handler = sinon.spy()
    @router.listenIncome(handler)

    @connectionSubscribeHanler(routerMessage)

    sinon.assert.calledWith(handler, 'payload')

#  it 'private configureMasterConnections', ->
#    @router.configureMasterConnections()
#
#    assert.equal(@router['connections']['room1.host.device1-i2c-1-5A'].test, 'test')
#    sinon.assert.calledWith(@connectionClassConstructor, @app, {
#      @app.config.devices.room1.host.device1.address...
#      host: "room1.host.device1"
#      bus: '1'
#    })

  it 'private resolveNextHostId', ->
    @app.host.id = 'currentHost'
    route = [ 'fromHost', 'currentHost', 'nextHost' ]

    assert.equal(@router.resolveNextHostId(route), 'nextHost')

    # TODO: test fail situations
