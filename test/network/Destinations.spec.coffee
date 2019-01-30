Destinations = require('../../plugin-bridge/network/Destinations').default


describe 'app.Destinations', ->
  beforeEach ->
    @dest = {
      type: 'i2c'
      bus: '1'
      address: '5a'
    }
    @payload = { payload: 'data' }
    @connection = {
      send: sinon.stub().returns(Promise.resolve())
    }
    @driverListenHandler = undefined
    @driver = {
      listenIncome: (addr, handler) => @driverListenHandler = handler
    }
    @drivers = {
      getDriver: => {
        getInstance: => @driver
      }
    }
    @myAddresses = [
      type: 'i2c'
      bus: '1'
      address: undefined
    ]
    @neighbors = {
      'remoteHost': @dest
    }

    @destinations = new Destinations(@drivers, @myAddresses, @neighbors)

  it 'init', ->
    @driver.listenIncome = sinon.spy()

    @destinations.init()

    assert.deepEqual(@destinations.connections, {
      'i2c-1': @driver
    })
    sinon.assert.calledWith(@driver.listenIncome, '5a')

  it 'send', ->
    @destinations.connections['i2c-1'] = @connection
    @destinations.send(@dest, @payload)

    sinon.assert.calledWith(@connection.send, '5a', @payload)

  it 'listenIncome and init', ->
    handler = sinon.spy()

    @destinations.init()
    @destinations.listenIncome(handler)

    @driverListenHandler(null, @payload)

    sinon.assert.calledWith(handler, null, @payload, @dest)

  it 'removeListener', ->
    handler = sinon.spy()

    @destinations.init()
    @destinations.listenIncome(handler)
    @destinations.removeListener(handler)

    @driverListenHandler(null, @payload)

    sinon.assert.notCalled(handler)
