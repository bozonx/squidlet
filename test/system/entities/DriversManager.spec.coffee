DriversManager = require('../../../system/managers/DriversManager').default
#initializationConfig = require('../../../system/initializationConfig').default


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
      # TODO: remove
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
    @system.envSet.loadConfig = => [ 'System.driver' ];

    await @driversManager.initSystemDrivers()

    assert.equal(@driversManager.getDriver('System.driver').defintion, @definitions['System.driver'])
    sinon.assert.calledOnce(@driversManager.getDriver('System.driver').init)

  it 'initRegularDrivers() and getDriver', ->
    @system.envSet.loadConfig = => [ 'Regular.driver' ];

    await @driversManager.initRegularDrivers()

    assert.equal(@driversManager.getDriver('Regular.driver').defintion, @definitions['Regular.driver'])
    sinon.assert.calledOnce(@driversManager.getDriver('Regular.driver').init)


  it '$setDevs and getIo()', ->
    ios = {
      'Io.io': @driver
    }

    # TODO: !!! WTF
    await @driversManager.$registerDevs(ios)

    assert.equal(@driversManager.getDriver('Dev.dev').defintion, @definitions['Io.io'])
    assert.equal(@driversManager.getIo('Dev').defintion, @definitions['Io.io'])
    sinon.assert.calledOnce(@driversManager.getDriver('Io.io').init)
