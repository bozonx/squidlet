Router = require('../../src/app/Router').default
#helpers = require('../../src/helpers/helpers')


describe 'app.Router', ->
  beforeEach ->
    @app = {
      isMaster: ->  true
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


  it 'init', ->
    @router.init()

  it 'publish', ->
