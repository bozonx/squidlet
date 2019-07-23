ImpulseOutput = require('../../../../entities/drivers/ImpulseOutput/ImpulseOutput').default


describe 'ImpulseOutput.driver', ->
  beforeEach ->
    @digitalOutput = {
      setup: sinon.stub().returns(Promise.resolve())
      read: sinon.stub().returns(Promise.resolve(true))
      write: sinon.stub().returns(Promise.resolve())
    }

    @definition = {
      id: 'ImpulseOutput.driver'
      className: 'ImpulseOutput.driver'
    }
    @props = {
      pin: 1
      impulseLength: 0
      blockTime: 0
      blockMode: 'refuse'
    }
    @env = {
      loadManifest: => Promise.resolve({ drivers: ['DigitalPinOutput.driver'] })
      getDriver: => {
        getInstance: => @digitalOutput
      }
    }

    @instantiate = =>
      @driver = await (new ImpulseOutput(@definition, @env)).getInstance(@props)

  it 'impulse with refuse', ->
    await @instantiate()
    @driver.impulseFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    await @driver.impulse()
    await @driver.impulse()

    assert.isTrue(@driver.impulseInProgress)
    assert.isUndefined(@driver.deferredImpulse)
    sinon.assert.calledOnce(@digitalOutput.write)
    sinon.assert.calledWith(@digitalOutput.write, true)
    sinon.assert.calledOnce(@driver.impulseFinished)

  it 'impulse with defer', ->
    @props.blockMode = 'defer'
    await @instantiate()
    @driver.impulseFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    await @driver.impulse()
    await @driver.impulse()

    assert.isTrue(@driver.impulseInProgress)
    assert.isTrue(@driver.deferredImpulse)
    sinon.assert.calledOnce(@digitalOutput.write)
    sinon.assert.calledWith(@digitalOutput.write, true)
    sinon.assert.calledOnce(@driver.impulseFinished)

  it 'impulseFinished', ->
    await @instantiate()
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    await @driver.impulseFinished()

    sinon.assert.calledOnce(@digitalOutput.write)
    sinon.assert.calledWith(@digitalOutput.write, false)
    assert.isFalse(@driver.impulseInProgress)
    assert.isTrue(@driver.blockTimeInProgress)
    sinon.assert.calledOnce(@driver.blockTimeFinished)

  it 'blockTimeFinished with refuse', ->
    await @instantiate()
    @driver.impulse = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    await @driver.blockTimeFinished()

    assert.isFalse(@driver.blockTimeInProgress)
    sinon.assert.notCalled(@driver.impulse)

  it 'blockTimeFinished with defer', ->
    @props.blockMode = 'defer'
    await @instantiate()
    @driver.impulse = sinon.stub().returns(Promise.resolve())
    await @driver.init()
    @driver.deferredImpulse = true

    await @driver.blockTimeFinished()

    assert.isFalse(@driver.blockTimeInProgress)
    assert.isUndefined(@driver.deferredImpulse)
    sinon.assert.calledOnce(@driver.impulse)
