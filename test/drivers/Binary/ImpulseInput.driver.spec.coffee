ImpulseInput = require('../../../host/src/drivers/Binary/ImpulseInput.driver').default


describe.only 'ImpulseInput.driver', ->
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
      blockTime: 0
    }
    @env = {
      loadManifest: => Promise.resolve({ drivers: ['DigitalInput.driver'] })
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
    @driver.startBlockTime = sinon.stub().returns(Promise.resolve())
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    @driver.addListener(@handler)

    await @digitalListenHandler(true)

    sinon.assert.calledOnce(@driver.startBlockTime)
    sinon.assert.notCalled(@driver.throttle)
