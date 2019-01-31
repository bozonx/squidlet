DriversManager = require('../../host/entities/DriversManager').default
initializationConfig = require('../../host/config/initializationConfig').default


describe 'app.DriversManager', ->
  beforeEach ->
    @driver = class
      constructor: (defintion) ->
        @defintion = defintion
      init: sinon.spy()

    @definitions = {
      'System.driver': {
        id: 'System.driver'
        className: 'System.driver'
        props: {
          otherParam: 1
        }
      }
      'Regular.driver': {
        id: 'Regular.driver'
        className: 'Regular.driver'
        props: {
          otherParam: 1
        }
      }
      'Dev.dev': {
        id: 'Dev.dev'
        className: 'Dev.dev'
        props: {
          otherParam: 1
        }
      }
    }

    @system = {
      initCfg: initializationConfig()
      host: {
        config: {}
      }
      configSet: {
        loadMain: => @driver
      }
    }
    @driversManager = new DriversManager(@system)
    @driversManager.loadDriversDefinitions = => @definitions

  it 'initSystemDrivers() and getDriver', ->
    @system.configSet.loadConfig = => [ 'System.driver' ];

    await @driversManager.initSystemDrivers()

    assert.equal(@driversManager.getDriver('System.driver').defintion, @definitions['System.driver'])
    sinon.assert.calledOnce(@driversManager.getDriver('System.driver').init)

  it 'initRegularDrivers() and getDriver', ->
    @system.configSet.loadConfig = => [ 'Regular.driver' ];

    await @driversManager.initRegularDrivers()

    assert.equal(@driversManager.getDriver('Regular.driver').defintion, @definitions['Regular.driver'])
    sinon.assert.calledOnce(@driversManager.getDriver('Regular.driver').init)


  it '$setDevs and getDev()', ->
    devs = {
      'Dev.dev': @driver
    }

    await @driversManager.$registerDevs(devs)

    assert.equal(@driversManager.getDriver('Dev.dev').defintion, @definitions['Dev.dev'])
    assert.equal(@driversManager.getDev('Dev').defintion, @definitions['Dev.dev'])
    sinon.assert.calledOnce(@driversManager.getDriver('Dev.dev').init)
