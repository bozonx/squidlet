DriversManager = require('../../host/src/app/entities/DriversManager').default
initializationConfig = require('../../host/src/app/config/initializationConfig').default


describe 'app.DriversManager', ->
  beforeEach ->
    @props = undefined
    @driver = class
      constructor: (props) ->
        @props = props
      init: sinon.spy()

    @definitions = {
      'System.driver': {
        id: 'System.driver'
        className: 'System.driver'
        props: {
          id: 'System.driver'
          otherParam: 1
        }
      }
      'Regular.driver': {
        id: 'Regular.driver'
        className: 'Regular.driver'
        props: {
          id: 'Regular.driver'
          otherParam: 1
        }
      }
      'Dev.dev': {
        id: 'Dev.dev'
        className: 'Dev.dev'
        props: {
          id: 'Dev.dev'
          otherParam: 1
        }
      }
    }

    @system = {
      initCfg: initializationConfig()
      configSet: {
        loadEntityClass: => @driver
      }
    }
    @driversManager = new DriversManager(@system)
    @driversManager.loadDriversDefinitions = => @definitions

  it 'initSystemDrivers() and getDriver', ->
    @system.configSet.loadConfig = => [ 'System.driver' ];

    await @driversManager.initSystemDrivers()

    assert.equal(@driversManager.getDriver('System.driver').props, @definitions['System.driver'].props)
    sinon.assert.calledOnce(@driversManager.getDriver('System.driver').init)

  it 'initRegularDrivers() and getDriver', ->
    @system.configSet.loadConfig = => [ 'Regular.driver' ];

    await @driversManager.initRegularDrivers()

    assert.equal(@driversManager.getDriver('Regular.driver').props, @definitions['Regular.driver'].props)
    sinon.assert.calledOnce(@driversManager.getDriver('Regular.driver').init)


  it '$setDevs and getDev()', ->
    devs = {
      'Dev.dev': @driver
    }

    await @driversManager.$setDevs(devs)

    assert.equal(@driversManager.getDriver('Dev.dev').props, @definitions['Dev.dev'].props)
    assert.equal(@driversManager.getDev('Dev').props, @definitions['Dev.dev'].props)
    sinon.assert.calledOnce(@driversManager.getDriver('Dev.dev').init)
