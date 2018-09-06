DevicesManager = require('../../host/src/app/DevicesManager').default
initializationConfig = require('../../host/src/app/config/initializationConfig').default


describe.only 'app.DevicesManager', ->
  beforeEach ->
#    @props = undefined
#    @driver = class
#      constructor: (props) ->
#        @props = props
#      init: sinon.spy()

#    @definitions = {
#      'System.driver': {
#        id: 'System.driver'
#        className: 'System.driver'
#        props: {
#          id: 'System.driver'
#          otherParam: 1
#        }
#      }
#      'Regular.driver': {
#        id: 'Regular.driver'
#        className: 'Regular.driver'
#        props: {
#          id: 'Regular.driver'
#          otherParam: 1
#        }
#      }
#      'Device.dev': {
#        id: 'Device.dev'
#        className: 'Device.dev'
#        props: {
#          id: 'Device.dev'
#          otherParam: 1
#        }
#      }
#    }

    @system = {
      initCfg: initializationConfig()
#      host: {
#        loadEntityClass: => @driver
#      }
    }
    @devicesManager = new DevicesManager(@system)

  it 'init() and getDevice', ->
