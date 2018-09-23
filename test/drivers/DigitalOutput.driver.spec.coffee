DigitalOutput = require('../../host/src/drivers/Digital/DigitalOutput.driver').default


describe.only 'DigitalOutput.driver', ->
  beforeEach ->
    @localDriver = {
      read: sinon.stub().returns(Promise.resolve(true))
      write: sinon.stub().returns(Promise.resolve())
    }

    @definition = {
      id: 'DigitalOutput.driver'
      className: 'DigitalOutput.driver'
    }
    @props = {
      pin: 1
      driver: {
        name: 'local'
      }
    }
    @env = {
      loadManifest: => Promise.resolve({ drivers: ['local'] })
      getDriver: => {
        getInstance: => @localDriver
      }
    }

    @driver = (new DigitalOutput(@definition, @env)).getInstance(@props)
    #await @driver.init();

  it 'read', ->
    result = await @driver.read()

    assert.isTrue(result)

  it 'read invert', ->

  it 'write', ->

  it 'write invert', ->

  it 'calcInitial', ->
