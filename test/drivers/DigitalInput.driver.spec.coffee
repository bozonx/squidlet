DigitalInput = require('../../host/src/drivers/Digital/DigitalInput.driver').default


describe.only 'DigitalInput.driver', ->
  beforeEach ->
    @watchHandler = undefined
    @localDriver = {
      setup: sinon.stub().returns(Promise.resolve())
      read: sinon.stub().returns(Promise.resolve(true))
      setWatch: (pin, handler) => @watchHandler = handler
    }

    @definition = {
      id: 'DigitalInput.driver'
      className: 'DigitalInput.driver'
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
      @driver = await (new DigitalInput(@definition, @env)).getInstance(@props)

  it 'init', ->
    await @instantiate()

    sinon.assert.calledOnce(@localDriver.setup)
    sinon.assert.calledWith(@localDriver.setup, 1, 'input')

  it 'init - pullup', ->
    @props.pullup = true
    await @instantiate()

    sinon.assert.calledOnce(@localDriver.setup)
    sinon.assert.calledWith(@localDriver.setup, 1, 'input_pullup')

  it 'init - pulldown', ->
    @props.pulldown = true
    await @instantiate()

    sinon.assert.calledOnce(@localDriver.setup)
    sinon.assert.calledWith(@localDriver.setup, 1, 'input_pulldown')

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

  it 'addListener', ->
    await @instantiate()
    handler = sinon.spy()

    @driver.addListener(handler, 30)
    @watchHandler(true)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, true)

  it 'addListener - invert', ->
    @props.invert = true
    await @instantiate()
    handler = sinon.spy()

    @driver.addListener(handler, 30)
    @watchHandler(true)

    sinon.assert.calledWith(handler, false)
