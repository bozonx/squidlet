DigitalOutput = require('../../host/src/drivers/Digital/DigitalOutput.driver').default


describe.only 'DigitalOutput.driver', ->
  beforeEach ->
    @definition = {
      id: 'DigitalOutput.driver'
      className: 'DigitalOutput.driver'
      props: {
        driver: {
          name: 'local'
        }
      }
    }
    @env = {
      getManifest: => Promise.resolve({ drivers: ['local'] })
    }

    @driver = new DigitalOutput(@definition, @env)

  it 'read', ->
