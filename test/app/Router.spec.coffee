Router = require('../../src/app/Router').default
#helpers = require('../../src/helpers/helpers')


describe 'app.Router', ->
  beforeEach ->
    @app = {
      isMaster: ->  true
    }

    @tunnelSubscribeHanler = undefined
    @tunnel = {
      publish: sinon.spy()
      subscribe: (handler) => @tunnelSubscribeHanler = handler
    }

    @message = {
      topic: 'room1.host.device1'
      category: 'deviceCallAction'
      from: {
        hostId: 'master'
        type: 'i2c'
        bus: '1'
        address: undefined
      }
      to:{
        hostId: 'room1.host1'
        type: 'i2c'
        bus: '1'
        address: '5A'
      }
      payload: {
        myData: 'data'
      }
    }

    @router = new Router(@app)
    @router['_tunnelTypes'] = { i2c: @tunnel }

  it 'init', ->
    #@router.init()

    # TODO: !!!!

  it 'publish', ->
    @router._tunnels = {
      'room1.host1-i2c-1-5A': @tunnel
    }

    await @router.publish(@message)

    sinon.assert.calledWith(@tunnel.publish, @message)

  it 'subscribe', ->
    @router._tunnels = {
      'room1.host1-i2c-1-5A': @tunnel
    }
    @router._listenToAllTunnels()
    handler = sinon.spy()
    @router.subscribe(handler)

    @tunnelSubscribeHanler(@message)

    sinon.assert.calledWith(handler, @message)

  it 'getHostId', ->
    # TODO: !!!!

  it 'getMyAddress', ->
    # TODO: !!!!
