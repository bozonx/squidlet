BinaryInput = require('../../../../entities/drivers/BinaryInput/BinaryInput').default


describe 'BinaryInput.driver', ->
  beforeEach ->
    @digitalListenHandler = undefined
    @digitalOutput = {
      setup: sinon.stub().returns(Promise.resolve())
      read: sinon.stub().returns(Promise.resolve(true))
      write: sinon.stub().returns(Promise.resolve())
      addListener: (handler) => @digitalListenHandler = handler
    }

    @definition = {
      id: 'BinaryInput.driver'
      className: 'BinaryInput.driver'
    }
    @props = {
      pin: 1
      debounce: 0
      debounceType: 'debounce'
      blockTime: 0
    }
    @env = {
      loadManifest: => Promise.resolve({ drivers: ['DigitalPinInput.driver'] })
      getDriver: => {
        getInstance: => @digitalOutput
      }
    }
    @handler = sinon.spy()

    @instantiate = =>
      @driver = await (new BinaryInput(@definition, @env)).getInstance(@props)

  it 'listen - simple debounce', ->
    await @instantiate()
    @driver.throttle = sinon.stub().returns(Promise.resolve())
    @driver.startBlockTime = sinon.stub().returns(Promise.resolve())
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    @driver.addListener(@handler)

    await @digitalListenHandler(true)

    sinon.assert.calledOnce(@driver.startBlockTime)
    sinon.assert.notCalled(@driver.throttle)

  it 'listen - throttle', ->
    @props.debounceType = 'throttle'
    await @instantiate()
    @driver.throttle = sinon.stub().returns(Promise.resolve())
    @driver.startBlockTime = sinon.stub().returns(Promise.resolve())
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    @driver.addListener(@handler)

    await @digitalListenHandler(true)

    sinon.assert.notCalled(@driver.startBlockTime)
    sinon.assert.calledOnce(@driver.throttle)

  it 'throttle', ->
    @props.debounceType = 'throttle'
    await @instantiate()
    @driver.startBlockTime = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    throttlePromise = @driver.throttle()

    assert.isTrue(@driver.throttleInProgress)

    await throttlePromise

    assert.isFalse(@driver.throttleInProgress)
    sinon.assert.calledOnce(@driver.startBlockTime)

  it 'startBlockTime', ->
    getLevel = sinon.stub().returns(Promise.resolve(true))
    await @instantiate()
    await @driver.init()

    startBlockTimePromise = @driver.startBlockTime(getLevel)

    assert.isTrue(@driver.blockTimeInProgress)

    await startBlockTimePromise

    assert.isFalse(@driver.blockTimeInProgress)
