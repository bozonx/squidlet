Pcf8574 = require('../../../../entities/drivers/Pcf8574/Pcf8574').default;


describe.only 'entities.drivers.Pcf8574', ->
  beforeEach ->
    @i2cToSlave = {
    }
    @context = {
      log: {
        error: () =>
      }
      config: {
        config: {
          queueJobTimeoutSec: 1
        }
      }
      getSubDriver: () => @i2cToSlave
      system: {
        envSet: {
          loadManifest: () => Promise.resolve({})
        }
      }
    }
    @writeBufferMs = 100
    @definition = {
      id: 'Pcf8574'
      className: 'Pcf8574'
      props: {
        busNum: 1
        address: '5a'
        writeBufferMs: @writeBufferMs
      }
    }
    @driver = new Pcf8574(@context, @definition)
    @expander = await @driver.subDriver({});

    await @expander.init()

  it "initIc", ->

