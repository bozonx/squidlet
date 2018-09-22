DigitalOutput = require('../../host/src/drivers/I2c/DigitalOutput.driver').default


describe 'DigitalOutput.driver', ->
  beforeEach ->

    @driver = new DigitalOutput()

  it 'read', ->
