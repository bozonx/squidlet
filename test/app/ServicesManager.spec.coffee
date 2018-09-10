ServicesManager = require('../../host/src/app/entities/ServicesManager').default
initializationConfig = require('../../host/src/app/config/initializationConfig').default


describe.only 'app.ServicesManager', ->
  beforeEach ->
    @props = undefined
    @service = class
      constructor: (props) ->
        @props = props
      init: sinon.spy()

    @definitions = {
      'systemService': {
        id: 'systemService'
        className: 'SystemServiceClass'
        props: {
          id: 'systemService'
          otherParam: 1
        }
      }
      'customService': {
        id: 'customService'
        className: 'CustomServiceClass'
        props: {
          id: 'customService'
          otherParam: 1
        }
      }
    }

    @system = {
      initCfg: initializationConfig()
      configSet: {
        loadEntityClass: => @service
        loadConfig: sinon.stub()
      }
    }
    @servicesManager = new ServicesManager(@system)
    @system.configSet.loadConfig.onCall(1).returns(@definitions)

  it 'initSystemServices() and getDriver', ->
    @system.configSet.loadConfig.onCall(0).returns([ 'systemService' ])

    await @servicesManager.initSystemServices()

    assert.equal(@servicesManager.getService('systemService').props, @definitions['systemService'].props)
    sinon.assert.calledOnce(@servicesManager.getService('systemService').init)

  it 'initRegularServices() and getDriver', ->
    @system.configSet.loadConfig.onCall(0).returns([ 'customService' ])

    await @servicesManager.initRegularServices()

    assert.equal(@servicesManager.getService('customService').props, @definitions['customService'].props)
    sinon.assert.calledOnce(@servicesManager.getService('customService').init)
