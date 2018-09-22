DigitalOutput = require('../../host/src/drivers/I2c/DigitalOutput.driver').default


describe.only 'DigitalOutput.driver', ->
  beforeEach ->

    @driver = new DigitalOutput()

  it 'read', ->
