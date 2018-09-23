DigitalInput = require('../../host/src/drivers/Digital/DigitalInput.driver').default


describe.only 'DigitalInput.driver', ->
  beforeEach ->
    @localDriver = {
      setup: sinon.stub().returns(Promise.resolve())
      read: sinon.stub().returns(Promise.resolve(true))
    }

    @definition = {
      id: 'DigitalInput.driver'
      className: 'DigitalInput.driver'
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
      @driver = await (new DigitalInput(@definition, @env)).getInstance(@props)

  it 'init', ->

