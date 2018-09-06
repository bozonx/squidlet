DriversManager = require('../../host/src/app/DriversManager').default


describe.only 'app.DriversManager', ->
  beforeEach ->
#    @MyDriver = class
#      config: undefined
#      constructor: (drivers, config) ->
#        @config = config
#      init: sinon.spy()
#
#    @driversPaths = new Map({
#      'MyDriver': '/path/to/MyDriver',
#    })
#    @driversConfig = {
#      'MyDriver': {
#        param1: 'value1'
#      }
#    }

    @system = {}
    @driversManager = new DriversManager(@system)
    #@drivers.require = sinon.stub().returns(@MyDriver)

  it 'initSystemDrivers() and getDriver', ->
    @drivers.initSystemDrivers()

    sinon.assert.calledWith(@drivers.require, '/path/to/MyDriver')
    assert.equal(@drivers.getDriver('MyDriver').config, @driversConfig['MyDriver'])
    sinon.assert.calledOnce(@drivers.getDriver('MyDriver').init)

  it 'initRegularDrivers() and getDriver', ->
    # TODO: !!!!

  it '$setDevs', ->
    # TODO: !!!!

