Destinations = require('../../src/network/Destinations').default


describe.only 'app.Destinations', ->
  beforeEach ->

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

    @dest = {
      type: 'i2c'
      bus: '1'
      address: '5a'
    }
    @payload = { payload: 'data' }
    @connection = {
      send: sinon.stub().returns(Promise.resolve())
    }
    @drivers = {}
    @myAddresses = []
    destinationsList = []

    @destinations = new Destinations(@drivers, @myAddresses, destinationsList)

  it 'send', ->
    @destinations.connections['i2c-1'] = @connection
    @destinations.send(@dest, @payload)

    sinon.assert.calledWith(@connection.send, '5a', @payload)

  it 'listenIncome', ->
    handler = sinon.spy()

    @destinations.init()
    @destinations.listenIncome(handler)

    sinon.assert.calledWith(handler, 1, 2)
