ServicesManager = require('../../../system/managers/ServicesManager').default
#initializationConfig = require('../../../system/initializationConfig').default


describe 'system.ServicesManager', ->
  beforeEach ->
    @service = class
      constructor: (definition) ->
        @definition = definition
      init: sinon.spy()

    @definitions = {
      'systemService': {
        id: 'systemService'
        className: 'SystemServiceClass'
        props: {
          otherParam: 1
        }
      }
      'customService': {
        id: 'customService'
        className: 'CustomServiceClass'
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
        loadMain: => @service
        loadConfig: sinon.stub()
      }
    }
    @servicesManager = new ServicesManager(@system)
    @system.envSet.loadConfig.onCall(1).returns(@definitions)

  it 'initSystemServices() and getDriver', ->
    @system.envSet.loadConfig.onCall(0).returns([ 'systemService' ])

    await @servicesManager.initSystemServices()

    assert.equal(@servicesManager.getService('systemService').definition, @definitions['systemService'])
    sinon.assert.calledOnce(@servicesManager.getService('systemService').init)

  it 'initRegularServices() and getDriver', ->
    @system.configSet.loadConfig.onCall(0).returns([ 'customService' ])

    await @servicesManager.initRegularServices()

    assert.equal(@servicesManager.getService('customService').definition, @definitions['customService'])
    sinon.assert.calledOnce(@servicesManager.getService('customService').init)
