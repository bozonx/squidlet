Network = require('../../plugin-bridge/network/Network').default
Drivers = require('../../../system/baseDrivers/DriverEnv').default
{ Map } = require('immutable');


srcHost = 'master'
midHost = 'mid'
dstHost = 'remote'
srcConfig = {
  connections: [
    {
      type: 'i2c'
      bus: '1'
      address: undefined
    }
  ]
  routes: {
    [dstHost]: [ srcHost, midHost, dstHost ]
  }
  neighbors: {
    [midHost]: {
      type: 'i2c'
      # TODO: bus тут не нужен - это bus на удаленном хосте
      bus: '1'
      address: '44'
    }
  }
  params: {
    routedMessageTTL: 10
  }
}
midConfig = {
  connections: [
    {
      type: 'i2c'
      bus: '1'
      address: '44'
    }
  ]
  routes: {
    [dstHost]: [ srcHost, dstHost ]
    [srcHost]: [ dstHost, srcHost ]
  }
  neighbors: {
    [dstHost]: {
      type: 'i2c'
      # TODO: bus тут не нужен - это bus на удаленном хосте
      bus: '1'
      address: '5a'
    }
    [srcHost]: {
      type: 'i2c'
      # TODO: bus тут не нужен - это bus на удаленном хосте
      bus: '1'
      address: undefined
    }
  }
  params: {
    routedMessageTTL: 10
  }
}
dstConfig = {
  connections: [
    {
      type: 'i2c'
      bus: '1'
      address: '5a'
    }
  ]
  routes: {
    [srcHost]: [ dstHost, srcHost ]
  }
  neighbors: {
    [midHost]: {
      type: 'i2c'
      # TODO: bus тут не нужен - это bus на удаленном хосте
      bus: '1'
      address: '44'
    }
  }
  params: {
    routedMessageTTL: 10
  }
}

payload = {
  to: dstHost
  payload: { myData: 1 }
}


describe 'integration network', ->
  beforeEach ->
    driversPaths = new Map({
      'I2c.connection.driver': '../network/connections/I2c.connection.driver.ts'
      'I2cMaster.driver': '../drivers/I2c/I2cMaster.driver.ts'
      'I2cSlave.driver': '../drivers/I2c/I2cSlave.driver.ts'
      'I2cData.driver': '../drivers/I2c/I2cData.driver.ts'
    })
    @drivers = new Drivers()

    @networkSrc = new Network(@drivers, srcHost, srcConfig)
    @networkMid = new Network(@drivers, midHost, midConfig)
    @networkDst = new Network(@drivers, dstHost, dstConfig)

    @midListenerToSrc = undefined
    @midListenerToDst = undefined
    @dstListener = undefined

    @networkSrc.router.destinations.setupConnections = ->
    @networkSrc.router.destinations.connections = {
      'i2c-1': {
        send: (address, payload) =>
          if (address == '44')
            @midListenerToSrc(null, payload)
        listenIncome: (address, handler) =>
      }
    }

    @networkMid.router.destinations.setupConnections = ->
    @networkMid.router.destinations.connections = {
      'i2c-1': {
        send: (address, payload) =>
          if (address == '5a')
            @dstListener(null, payload)
        listenIncome: (address, handler) =>
          if (!address)
            @midListenerToSrc = handler
          else if (address == '5a')
            @midListenerToDst = handler
      }
    }

    @networkDst.router.destinations.setupConnections = ->
    @networkDst.router.destinations.connections = {
      'i2c-1': {
        send: (address, payload) =>
        listenIncome: (address, handler) => @dstListener = handler
      }
    }

    @drivers.init(driversPaths, {})
    @networkSrc.init()
    @networkMid.init()
    @networkDst.init()

  it 'send and receive', ->
    handler = sinon.spy()
    @networkDst.listenIncome(handler)
    await @networkSrc.send(dstHost, payload)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, null, payload)
