BinaryInput = require('../../../host/src/drivers/Binary/BinaryInput.driver').default


describe.only 'BinaryInput.driver', ->
  beforeEach ->
    @digitalOutput = {
      setup: sinon.stub().returns(Promise.resolve())
      read: sinon.stub().returns(Promise.resolve(true))
      write: sinon.stub().returns(Promise.resolve())
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

    @instantiate = =>
      @driver = await (new BinaryInput(@definition, @env)).getInstance(@props)

  it 'write', ->
    await @instantiate()
    @driver.blockTimeFinished = sinon.stub().returns(Promise.resolve())
    await @driver.init()

    await @driver.write(true)
