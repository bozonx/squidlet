DigitalPinOutput = require('../../../../entities/drivers/DigitalPinOutput/DigitalPinOutput').default


describe 'DigitalPinOutput.driver', ->
  beforeEach ->
    @localDriver = {
      setup: sinon.stub().returns(Promise.resolve())
      read: sinon.stub().returns(Promise.resolve(true))
      write: sinon.stub().returns(Promise.resolve())
    }

    @definition = {
      id: 'DigitalPinOutput.driver'
      className: 'DigitalPinOutput.driver'
    }
    @props = {
      pin: 1
      driver: {
        name: 'local'
      }
    }
    @env = {
      loadManifest: => Promise.resolve({ drivers: ['Digital_local.driver'] })
      getDriver: => {
        getInstance: => @localDriver
      }
    }

    @instantiate = =>
      @driver = await (new DigitalPinOutput(@definition, @env)).getInstance(@props)

  it 'init without initial', ->
    await @instantiate()

    sinon.assert.calledOnce(@localDriver.setup)
    sinon.assert.calledOnce(@localDriver.write)
    sinon.assert.calledWith(@localDriver.setup, 1, 'output')
    sinon.assert.calledWith(@localDriver.write, 1, false)

  it 'init - invert without initial', ->
    @props.invert = true
    await @instantiate()

    sinon.assert.calledWith(@localDriver.setup, 1, 'output')
    sinon.assert.calledWith(@localDriver.write, 1, true)

  it 'init - initial = low', ->
    @props.initial = 'low'
    await @instantiate()

    sinon.assert.calledWith(@localDriver.write, 1, false)

  it 'init - initial = high', ->
    @props.initial = 'high'
    await @instantiate()

    sinon.assert.calledWith(@localDriver.write, 1, true)

  it 'init - invert and initial = low', ->
    @props.invert = true
    @props.initial = 'low'
    await @instantiate()

    sinon.assert.calledWith(@localDriver.write, 1, true)

  it 'init - invert and initial = high', ->
    @props.invert = true
    @props.initial = 'high'
    await @instantiate()

    sinon.assert.calledWith(@localDriver.write, 1, false)

  it 'read', ->
    await @instantiate()

    result = await @driver.read()

    assert.isTrue(result)
    sinon.assert.calledOnce(@localDriver.read)

  it 'read invert', ->
    @props.invert = true
    await @instantiate()

    result = await @driver.read()

    assert.isFalse(result)
    sinon.assert.calledOnce(@localDriver.read)

  it 'write', ->
    await @instantiate()

    await @driver.write(true)

    # called first on init and on write
    sinon.assert.calledTwice(@localDriver.write)
    sinon.assert.calledWith(@localDriver.write.getCall(1), 1, true)

  it 'write invert', ->
    @props.invert = true
    await @instantiate()

    await @driver.write(true)

    # called first on init and on write
    sinon.assert.calledTwice(@localDriver.write)
    sinon.assert.calledWith(@localDriver.write.getCall(1), 1, false)
