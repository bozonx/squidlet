Router = require('../../src/app/Router').default


describe 'app.Router', ->
  beforeEach ->
    @app = {
      host: {
        id: 'master'
        config: {
          host: {
            routedMessageTTL: 100
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
      publish: sinon.spy()
      subscribe: (handler) => @connectionSubscribeHanler = handler
    }

    @connectionClassConstructor = sinon.spy()
    connectionClassConstructor = @connectionClassConstructor
    @connectionClass = class
      constructor: (params...) -> connectionClassConstructor(params...)
      test: 'test'
      init: ->

    @message = {
      topic: 'room1.host.device1'
      category: 'deviceCallAction'
      from: {
        host: 'master'
        type: 'i2c'
        bus: '1'
        address: undefined
      }
      to: {
        host: 'room1.host1'
        type: 'i2c'
        bus: '1'
        address: '5A'
      }
      payload: {
        myData: 'data'
      }
    }

    @router = new Router(@app)
    #@router['_connectionTypes'] = { i2c: @connectionClass }
    @router['connectionTypes'].i2c = @connectionClass

  it 'init - not master', ->
    @router.init()

    assert.equal(@router['connections']['master-local'].constructor.name, 'LocalConnection')

  it 'publish', ->
    @router.connections = {
      'room1.host1-i2c-1-5A': @connection
    }

    await @router.publish(@message)

    sinon.assert.calledWith(@connection.publish, @message)

  it 'subscribe', ->
    @router.connections = {
      'room1.host1-i2c-1-5A': @connection
    }
    @router.listenToAllConnections()
    handler = sinon.spy()
    @router.subscribe(handler)

    @connectionSubscribeHanler(@message)

    sinon.assert.calledWith(handler, @message)

  it 'private configureMasterConnections', ->
    @router.configureMasterConnections()

    assert.equal(@router['connections']['room1.host.device1-i2c-1-5A'].test, 'test')
    sinon.assert.calledWith(@connectionClassConstructor, @app, {
      @app.config.devices.room1.host.device1.address...
      host: "room1.host.device1"
      bus: '1'
    })

  it.only 'private resolveNextHostId', ->
    @app.host.id = 'currentHost'
    route = [ 'fromHost', 'currentHost', 'nextHost' ]

    assert.equal(@router.resolveNextHostId(route), 'nextHost')

    # TODO: test fail situations
