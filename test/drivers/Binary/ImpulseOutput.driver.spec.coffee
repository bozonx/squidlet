ImpulseOutput = require('../../../host/src/drivers/Digital/ImpulseOutput.driver').default


describe 'ImpulseOutput.driver', ->
  beforeEach ->
    @localDriver = {
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
      driver: {
        name: 'local'
      }
    }
    @env = {
      loadManifest: => Promise.resolve({ drivers: ['Digital_local.driver'] })
      getDriver: => {
        getInstance: => @localDriver
      }
    }

    @instantiate = =>
      @driver = await (new ImpulseOutput(@definition, @env)).getInstance(@props)

  it 'init without initial', ->
    await @instantiate()
