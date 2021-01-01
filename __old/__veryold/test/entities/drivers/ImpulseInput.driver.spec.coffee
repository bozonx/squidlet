ImpulseInput = require('../../../../entities/drivers/ImpulseInput/ImpulseInput').default


describe 'ImpulseInput.driver', ->
  beforeEach ->
    @digitalListenHandler = undefined
    @digitalOutput = {
      setup: sinon.stub().returns(Promise.resolve())
      read: sinon.stub().returns(Promise.resolve(true))
      write: sinon.stub().returns(Promise.resolve())
      addListener: (handler) => @digitalListenHandler = handler
    }

    @definition = {
      id: 'ImpulseInput.driver'
      className: 'ImpulseInput.driver'
    }
    @props = {
      pin: 1
      impulseLength: 0
      blockTime: 1
    }
    @env = {
      loadManifest: => Promise.resolve({ drivers: ['DigitalPinInput.driver'] })
      getDriver: => {
        getInstance: => @digitalOutput
      }
    }
    @handler = sinon.spy()

    @instantiate = =>
      @driver = await (new ImpulseInput(@definition, @env)).getInstance(@props)

  it 'listen - simple debounce', ->
    await @instantiate()
    @driver.throttle = sinon.stub().returns(Promise.resolve())
    @driver.startImpulse = sinon.stub().returns(Promise.resolve())
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    @driver.addListener(@handler)

    await @digitalListenHandler(true)

    sinon.assert.calledOnce(@driver.startImpulse)
    sinon.assert.notCalled(@driver.throttle)

  it 'listen - throttle', ->
    @props.throttle = 1
    await @instantiate()
    @driver.throttle = sinon.stub().returns(Promise.resolve())
    @driver.startImpulse = sinon.stub().returns(Promise.resolve())
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    @driver.addListener(@handler)

    await @digitalListenHandler(true)

    sinon.assert.notCalled(@driver.startImpulse)
    sinon.assert.calledOnce(@driver.throttle)

  it 'startImpulse', ->
    risingHandler = sinon.spy()
    await @instantiate()
    @driver.startBlockTime = sinon.stub().returns(Promise.resolve())
    await @driver.init()
    @driver.addListener(@handler)
    @driver.addRisingListener(risingHandler)

    startImpulsePromise = @driver.startImpulse()

    assert.isTrue(@driver.impulseInProgress)
    sinon.assert.calledOnce(risingHandler)
    sinon.assert.calledOnce(@handler)
    sinon.assert.calledWith(@handler, true)

    await startImpulsePromise

    sinon.assert.calledTwice(@handler)
    sinon.assert.calledWith(@handler.getCall(1), false)
    assert.isFalse(@driver.impulseInProgress)
    sinon.assert.calledOnce(@driver.startBlockTime)

  it 'startBlockTime', ->
    getLevel = sinon.stub().returns(Promise.resolve(true))
    await @instantiate()
    await @driver.init()

    startBlockTimePromise = @driver.startBlockTime(getLevel)

    assert.isTrue(@driver.blockTimeInProgress)

    await startBlockTimePromise

    assert.isFalse(@driver.blockTimeInProgress)
