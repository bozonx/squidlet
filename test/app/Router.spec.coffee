Router = require('../../src/app/Router').default


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
            'destHost': {
              type: 'collector'
              route: [ 'currentHost', 'nextHost', 'destHost' ]
            }
          }
          neighbors: {
            nextHost: {
              host: 'nextHost'
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

    @connectionSubscribeHanler = undefined
    @connection = {
      send: sinon.stub().returns(Promise.resolve())
      listenIncome: (handler) => @connectionSubscribeHanler = handler
    }

    @connectionClassConstructor = sinon.spy()
    connectionClassConstructor = @connectionClassConstructor
    @connectionClass = class
      constructor: (params...) -> connectionClassConstructor(params...)
      test: 'test'
      init: ->

    @router = new Router(@app)
    @router['connectionTypes'].i2c = @connectionClass

#  it 'init', ->
#    @router.init()
#
#    assert.equal(@router['connections']['master-local'].constructor.name, 'LocalConnection')

  it 'send', ->
    @router.connections = {
      'nextHost-i2c-1-5a': @connection
    }

    await @router.send('destHost', 'payload')

    sinon.assert.calledWith(@connection.send, {
      payload: 'payload'
      route: ['currentHost', 'nextHost', 'destHost']
      ttl: 100
    })

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
      'nextHost-i2c-1-5a': @connection
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
