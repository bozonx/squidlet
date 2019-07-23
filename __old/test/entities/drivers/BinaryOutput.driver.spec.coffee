BinaryOutput = require('../../../../entities/drivers/BinaryOutput/BinaryOutput').default


describe 'BinaryOutput.driver', ->
  beforeEach ->
    @digitalOutput = {
      setup: sinon.stub().returns(Promise.resolve())
      read: sinon.stub().returns(Promise.resolve(true))
      write: sinon.stub().returns(Promise.resolve())
    }

    @definition = {
      id: 'BinaryOutput.driver'
      className: 'BinaryOutput.driver'
    }
    @props = {
      pin: 1
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
      @driver = await (new BinaryOutput(@definition, @env)).getInstance(@props)

  it 'write with refuse', ->
    await @instantiate()
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    await @driver.write(true)
    await @driver.write(true)

    assert.isTrue(@driver.blockTimeInProgress)
    assert.isUndefined(@driver.lastDeferredValue)
    sinon.assert.calledOnce(@digitalOutput.write)
    sinon.assert.calledWith(@digitalOutput.write, true)
    sinon.assert.calledOnce(@driver.blockTimeFinished)

  it 'write with defer', ->
    @props.blockMode = 'defer'
    await @instantiate()
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    await @driver.write(true)
    await @driver.write(false)

    assert.isTrue(@driver.blockTimeInProgress)
    assert.isFalse(@driver.lastDeferredValue)
    sinon.assert.calledOnce(@digitalOutput.write)
    sinon.assert.calledWith(@digitalOutput.write, true)
    sinon.assert.calledOnce(@driver.blockTimeFinished)

  it 'blockTimeFinished with refuse', ->
    await @instantiate()
    @driver.write = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    await @driver.blockTimeFinished()

    assert.isFalse(@driver.blockTimeInProgress)
    sinon.assert.notCalled(@driver.write)

  it 'blockTimeFinished with defer', ->
    @props.blockMode = 'defer'
    await @instantiate()
    @driver.write = sinon.stub().returns(Promise.resolve())
    await @driver.init()
    @driver.lastDeferredValue = true

    await @driver.blockTimeFinished()

    assert.isFalse(@driver.blockTimeInProgress)
    assert.isUndefined(@driver.lastDeferredValue)
    sinon.assert.calledOnce(@driver.write)
    sinon.assert.calledWith(@driver.write, true)
