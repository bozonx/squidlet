Network = require('../../src/network/Network').default
Drivers = require('../../src/app/Drivers').default
{ Map } = require('immutable');


describe.only 'integration network', ->
  beforeEach ->
    driversPaths = new Map({
      'I2c.connection.driver': '../network/connections/I2c.connection.driver.ts'
      'I2cMaster.driver': '../drivers/I2cMaster.driver.ts'
      'I2cSlave.driver': '../drivers/I2cSlave.driver.ts'
      'I2cData.driver': '../drivers/I2cData.driver.ts'
#      'I2cMaster.dev': '../dev/I2cMaster.dev.ts'
#      'I2cSlave.dev': '../dev/I2cSlave.dev.ts'
    })
    @drivers = new Drivers()
    @srcHost = 'master'
    @dstHost = 'remote'
    @srcConfig = {
      connections: [
        {
          type: 'i2c'
          bus: '1'
          address: undefined
        }
      ]
      routes: {
        [@dstHost]: [ @srcHost ]
      }
      neighbors: {
        [@dstHost]: {
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
    @dstConfig = {
      connections: [
        {
          type: 'i2c'
          bus: '1'
          address: '5a'
        }
      ]
      routes: {
        [@srcHost]: [ @dstHost ]
      }
      neighbors: {
        [@srcHost]: {
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

    @payload = {
      to: @dstHost
      payload: { myData: 1 }
    }

    @I2cMasterDevInstance = {

    }
    @I2cMasterDev = class
      getInstance: -> @I2cMasterDevInstance

    @I2cSlaveDevInstance = {

    }
    @I2cSlaveDev = class
      getInstance: -> @I2cSlaveDevInstance

    oldGetDriver = @drivers.getDriver
    @drivers.getDriver = (driverName) =>
      if (driverName == 'I2cMaster.dev')
        return @I2cMasterDev
      if (driverName == 'I2cSlave.dev')
        return @I2cSlaveDev

      return oldGetDriver(driverName)

    @networkSrc = new Network(@drivers, @srcHost, @srcConfig)
    @networkDst = new Network(@drivers, @dstHost, @dstConfig)

    @drivers.init(driversPaths, {})
    @networkSrc.init()
    @networkDst.init()

  it 'send', ->
    handler = sinon.spy()
    @networkDst.listenIncome(handler)
    @networkSrc.send(@toHost, @payload)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, null, @payload)
    # TODO: на другом конце network.listenIncome - мы должны получить отправленные данные
