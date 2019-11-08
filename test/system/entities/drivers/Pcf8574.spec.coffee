Pcf8574 = require('../../../../entities/drivers/Pcf8574/Pcf8574').default;
{PinDirection} = require('../../../../system/interfaces/gpioTypes');


describe.only 'entities.drivers.Pcf8574', ->
  beforeEach ->
    @pin0 = 0
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

  it "setupInput", ->
    await @expander.setupInput(@pin0)

    assert.equal(@expander.getPinDirection(@pin0), PinDirection.input)
    # input pins are marked as high level
    assert.equal(@expander.getState(), 0b00000001)
    assert.isTrue(@expander.hasInputPins())
    assert.isFalse(@expander.isIcInitialized())

  it "setupInput - don't allow resetup, only after clear pin", ->
    await @expander.setupInput(@pin0)

    assert.isRejected(@expander.setupOutput(@pin0))
    assert.isRejected(@expander.setupInput(@pin0))

    @expander.clearPin(@pin0)

    assert.isUndefined(@expander.getPinDirection(@pin0))

    await @expander.setupInput(@pin0)

    assert.equal(@expander.getPinDirection(@pin0), PinDirection.input)

  it "setupOutput", ->
    await  @expander.setupOutput(@pin0, true)

    assert.equal(@expander.getPinDirection(@pin0), PinDirection.output)
    assert.isTrue(@expander.getPinState(@pin0))
    # initial value of pin 0 = true
    assert.equal(@expander.getState(), 0b00000001)
    assert.isFalse(@expander.hasInputPins())
    assert.isFalse(@expander.isIcInitialized())

  it "setupOutput - don't allow resetup, only after clear pin", ->
    await @expander.setupOutput(@pin0)

    assert.isRejected(@expander.setupOutput(@pin0))
    assert.isRejected(@expander.setupInput(@pin0))

    @expander.clearPin(@pin0)

    assert.isUndefined(@expander.getPinDirection(@pin0))

    await @expander.setupOutput(@pin0, true)

    assert.equal(@expander.getPinDirection(@pin0), PinDirection.output)

  it "initIc", ->
    await @expander.setupInput(@pin0)
    await @expander.setupOutput(1, true)


