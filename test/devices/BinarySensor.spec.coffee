BinarySensor = require('../../src/devices/BinarySensor/BinarySensor').default


describe.only 'devices.BinarySensor', ->
  beforeEach ->
    @system = {}
    @deviceConf = {}
    @binarySensor = new BinarySensor(@system, @deviceConf)

  it 'init', ->
    # TODO: !!!!

