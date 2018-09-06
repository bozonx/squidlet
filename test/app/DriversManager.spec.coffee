DriversManager = require('../../host/src/app/DriversManager').default
initializationConfig = require('../../host/src/app/config/initializationConfig').default


describe.only 'app.DriversManager', ->
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
    }

    @system = {
      initCfg: initializationConfig()
      host: {
        loadEntityClass: => @driver
      }
    }
    @driversManager = new DriversManager(@system)
    @driversManager.loadDriversDefinitions = => @definitions

  it 'initSystemDrivers() and getDriver', ->
    @system.host.loadConfig = => [ 'System.driver' ];

    await @driversManager.initSystemDrivers()

    assert.equal(@driversManager.getDriver('System.driver').props, @definitions['System.driver'].props)
    sinon.assert.calledOnce(@driversManager.getDriver('System.driver').init)

  it 'initRegularDrivers() and getDriver', ->
    @system.host.loadConfig = => [ 'Regular.driver' ];

    await @driversManager.initRegularDrivers()

    assert.equal(@driversManager.getDriver('Regular.driver').props, @definitions['Regular.driver'].props)
    sinon.assert.calledOnce(@driversManager.getDriver('Regular.driver').init)


  it '$setDevs', ->
    # TODO: !!!!

