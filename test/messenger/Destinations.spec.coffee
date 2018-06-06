Destinations = require('../../src/messenger/Destinations').default


describe.only 'app.Destinations', ->
  beforeEach ->
    @neighbors = [
      {
        type: 'i2c'
        bus: '1'
        address: '5a'
      }
    ]

#    @app = {
#      host: {
#        id: 'currentHost'
#        config: {
#          host: {
#            routedMessageTTL: 100
#          }
#          routes: {
#            'destHost': [ 'currentHost', 'nextHost', 'destHost' ]
#          }
#          neighbors: {
#            nextHost:
#          }
#        }
#      }
##      config: {
##        devices: {
##          room1: {
##            host: {
##              device1: {
##                device: 'host'
##                address: {
##                  type: 'i2c'
##                  bus: 1
##                  address: '5A'
##                }
##              }
##            }
##          }
##        }
##      }
#    }

    #    @connectionSubscribeHanler = undefined
    #    @connection = {
    #      send: sinon.stub().returns(Promise.resolve())
    #      listenIncome: (handler) => @connectionSubscribeHanler = handler
    #    }

#    @destinationsSubscribeHanler = undefined
#    @destinations = {
#      send: sinon.stub().returns(Promise.resolve())
#      listenIncome: (handler) => @destinationsSubscribeHanler = handler
#    }

    #    @connectionClassConstructor = sinon.spy()
    #    connectionClassConstructor = @connectionClassConstructor
    #    @connectionClass = class
    #      constructor: (params...) -> connectionClassConstructor(params...)
    #      test: 'test'
    #      init: ->

    @destinations = new Destinations(@neighbors)

  #@router['connectionTypes'].i2c = @connectionClass
  #    @router.connections = {
  #      'i2c-1': @connection
  #    }

  #  it 'private configureMasterConnections', ->
  #    @router.configureMasterConnections()
  #
  #    assert.equal(@router['connections']['room1.host.device1-i2c-1-5A'].test, 'test')
  #    sinon.assert.calledWith(@connectionClassConstructor, @app, {
  #      @app.config.devices.room1.host.device1.address...
  #      host: "room1.host.device1"
  #      bus: '1'
  #    })


  it 'send', ->


  it 'listenIncome', ->
