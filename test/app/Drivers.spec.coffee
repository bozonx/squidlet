{ Map } = require('immutable')

DriverEnv = require('../../host/src/app/DriverEnv').default


describe 'app.DriverEnv', ->
  beforeEach ->
    @MyDriver = class
      config: undefined
      constructor: (drivers, config) ->
        @config = config
      init: sinon.spy()

    @driversPaths = new Map({
      'MyDriver': '/path/to/MyDriver',
    })
    @driversConfig = {
      'MyDriver': {
        param1: 'value1'
      }
    }

    @system = {}
    @drivers = new DriverEnv(@system)
    @drivers.require = sinon.stub().returns(@MyDriver)

  it 'init and getDriver', ->
    @drivers.init(@driversPaths, @driversConfig)

    sinon.assert.calledWith(@drivers.require, '/path/to/MyDriver')
    assert.equal(@drivers.getDriver('MyDriver').config, @driversConfig['MyDriver'])
    sinon.assert.calledOnce(@drivers.getDriver('MyDriver').init)
