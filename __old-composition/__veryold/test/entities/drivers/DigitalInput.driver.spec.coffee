DigitalPinInput = require('../../../../entities/drivers/DigitalPinInput/DigitalPinInput').default


describe 'DigitalPinInput.driver', ->
  beforeEach ->
    @watchHandler = undefined
    @localDriver = {
      setup: sinon.stub().returns(Promise.resolve())
      read: sinon.stub().returns(Promise.resolve(true))
      setWatch: (pin, handler) =>
        @watchHandler = handler
        return 5
      clearWatch: sinon.spy()
    }

    @definition = {
      id: 'DigitalPinInput.driver'
      className: 'DigitalPinInput.driver'
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
      system: {
        host: {
          config: {
            config: {
              drivers: {
                #defaultDigitalPinInputDebounce: 25
              }
            }
          }
        }
      }
    }

    @instantiate = =>
      @driver = await (new DigitalPinInput(@definition, @env)).getInstance(@props)

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

    @driver.addListener(handler)
    @watchHandler(true)

    sinon.assert.calledWith(handler, false)

  it 'listenOnce', ->
    await @instantiate()
    handler = sinon.spy()

    @driver.listenOnce(handler)

    assert.equal(Object.keys(@driver.listeners).length, 1)

    @watchHandler(true)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, true)
    assert.equal(Object.keys(@driver.listeners).length, 0)


  it 'listenOnce - invert', ->
    @props.invert = true
    await @instantiate()
    handler = sinon.spy()

    @driver.listenOnce(handler)

    assert.equal(Object.keys(@driver.listeners).length, 1)

    @watchHandler(true)

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, false)
    assert.equal(Object.keys(@driver.listeners).length, 0)

  it 'removeListener', ->
    await @instantiate()
    handler = sinon.spy()

    @driver.addListener(handler)

    assert.equal(Object.keys(@driver.listeners).length, 1)

    @driver.removeListener(handler)

    assert.equal(Object.keys(@driver.listeners).length, 0)
    sinon.assert.calledOnce(@localDriver.clearWatch)
    sinon.assert.calledWith(@localDriver.clearWatch, 5)
