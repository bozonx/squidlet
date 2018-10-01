BinaryInput = require('../../../host/src/drivers/Binary/BinaryInput.driver').default


describe.only 'BinaryInput.driver', ->
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
      debounce: 50
      debounceType: 'debounce'
      blockTime: 0
    }
    @env = {
      loadManifest: => Promise.resolve({ drivers: ['DigitalOutput.driver'] })
      getDriver: => {
        getInstance: => @digitalOutput
      }
    }
    @handler = sinon.spy()

    @instantiate = =>
      @driver = await (new BinaryInput(@definition, @env)).getInstance(@props)

  it 'listen', ->
    await @instantiate()
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    @driver.addListener(@handler)

    await @digitalListenHandler(true)
