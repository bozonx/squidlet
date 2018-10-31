Mqtt = require('../../host/src/services/Mqtt/Mqtt.ts').default


describe.only 'app.Messenger', ->
  beforeEach ->
    @mqttDevConnection = {
      onMessage: sinon.spy()
    }
    @mqttDev = {
      connect: sinon.stub().returns(@mqttDevConnection)
    }
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
      loadManifest: => Promise.resolve({ drivers: ['Mqtt.dev'] })
      getDriver: => @mqttDev
    }

    @mqtt = new Mqtt(@definition, @env)

  it 'init', ->
    await @mqtt.init()

    sinon.assert.calledOnce(@mqttDev.connect)
    sinon.assert.calledWith(@mqttDev.connect, @props)
    sinon.assert.calledOnce(@mqttDevConnection.onMessage)
