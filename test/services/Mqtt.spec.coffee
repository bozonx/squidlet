Mqtt = require('../../host/src/services/Mqtt/Mqtt.ts').default


describe.only 'app.Messenger', ->
  beforeEach ->
    @props = {
      protocol: 'http'
      host: 'localhost'
      port: 12345
      listenHosts: []
    }
    @definition = {
      id: 'mqtt'
      className: 'Mqtt'
      props: @props
    }
    @env = {
#      loadManifest: => Promise.resolve({ drivers: ['DigitalInput.driver'] })
#      getDriver: => {
#        getInstance: => @digitalOutput
#      }
    }

    @mqtt = new Mqtt(@definition, @env)

  it 'init', ->

