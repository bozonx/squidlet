Network = require('../../plugin-bridge/network/Network').default
Drivers = require('../../../system/baseDrivers/DriverEnv').default
{ Map } = require('immutable');


srcHost = 'master'
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
    [dstHost]: [ srcHost, dstHost ]
  }
  neighbors: {
    [dstHost]: {
      type: 'i2c'
      # TODO: bus тут не нужен - это bus на удаленном хосте
      bus: '1'
      address: '5a'
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

    @destListenHandler = undefined

    @I2cMasterDevInstance = {
      writeTo: (addrHex, data) =>
        @destListenHandler(data)
    }
    @I2cMaster = {
      getInstance: => @I2cMasterDevInstance
    }

    @I2cSlaveDevInstance = {
      listenIncome: (handler) => @destListenHandler = handler
      removeListener: =>
    }
    @I2cSlaveIo = {
      getInstance: => @I2cSlaveDevInstance
    }

    oldGetDriver = @drivers.getDriver.bind(@drivers)
    @drivers.getDriver = (driverName) =>
      if (driverName == 'I2cMaster.dev')
        return @I2cMaster
      if (driverName == 'I2cSlave.dev')
        return @I2cSlaveIo

      return oldGetDriver(driverName)

    @networkSrc = new Network(@drivers, srcHost, srcConfig)
    @networkDst = new Network(@drivers, dstHost, dstConfig)

    @drivers.init(driversPaths, {})
    @networkSrc.init()
    @networkDst.init()

  it 'send and receive', ->
    handler = sinon.spy()
    @networkDst.listenIncome(handler)
    await @networkSrc.send(dstHost, payload)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, null, payload)
