ImpulseOutput = require('../../../host/src/drivers/Binary/ImpulseOutput.driver').default


describe.only 'ImpulseOutput.driver', ->
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
      impulseLength: 100
      blockTime: 50
    }
    @env = {
      loadManifest: => Promise.resolve({ drivers: ['DigitalOutput.driver'] })
      getDriver: => {
        getInstance: => @digitalOutput
      }
    }

    @instantiate = =>
      @driver = await (new ImpulseOutput(@definition, @env)).getInstance(@props)

  it 'impulse', ->
    await @instantiate()

    clock = sinon.useFakeTimers()

    impulsePromise = @driver.impulse()

    assert.isTrue(@driver.impulseInProgress)
    sinon.assert.calledOnce(@digitalOutput.write)
    sinon.assert.calledWith(@digitalOutput.write, true)

    clock.tick(100)

    clock.restore()



# TODO: test block modes
