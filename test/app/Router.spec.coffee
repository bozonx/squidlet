Router = require('../../src/app/Router').default


describe 'app.Router', ->
  beforeEach ->
    @app = {
      host: {
        getId: -> 'master'
        isMaster: ->  false
      }
      config: {
        devices: {
          room1: {
            host: {
              device1: {
                device: 'host'
                address: {
                  type: 'i2c'
                  bus: 1
                  address: '5A'
                }
              }
            }
          }
        }
      }
    }

    @tunnelSubscribeHanler = undefined
    @tunnel = {
      publish: sinon.spy()
      subscribe: (handler) => @tunnelSubscribeHanler = handler
    }

    @tunnelClassConstructor = sinon.spy()
    tunnelClassConstructor = @tunnelClassConstructor
    @tunnelClass = class
      constructor: (params...) -> tunnelClassConstructor(params...)
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
    #@router['_tunnelTypes'] = { i2c: @tunnelClass }
    @router['tunnelTypes'].i2c = @tunnelClass

  it 'init - not master', ->
    @router.init()

    assert.equal(@router['tunnels']['master-local'].constructor.name, 'LocalTunnel')

  it 'publish', ->
    @router.tunnels = {
      'room1.host1-i2c-1-5A': @tunnel
    }

    await @router.publish(@message)

    sinon.assert.calledWith(@tunnel.publish, @message)

  it 'subscribe', ->
    @router.tunnels = {
      'room1.host1-i2c-1-5A': @tunnel
    }
    @router.listenToAllTunnels()
    handler = sinon.spy()
    @router.subscribe(handler)

    @tunnelSubscribeHanler(@message)

    sinon.assert.calledWith(handler, @message)

  it 'private configureMasterTunnels', ->
    @router.configureMasterTunnels()

    assert.equal(@router['tunnels']['room1.host.device1-i2c-1-5A'].test, 'test')
    sinon.assert.calledWith(@tunnelClassConstructor, @app, {
      @app.config.devices.room1.host.device1.address...
      host: "room1.host.device1"
      bus: '1'
    })
