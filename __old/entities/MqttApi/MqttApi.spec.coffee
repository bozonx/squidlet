Mqtt = require('./MqttApi').default


describe 'services.Mqtt', ->
  beforeEach ->
    @mqttDevConnection = {
      onMessage: sinon.spy()
      publish: sinon.spy()
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
      host: {
        getAllTheHostsIds: => ['master']
        resolveHostIdByEntityId: => 'master'
      }
      messenger: {
        subscribeCategory: sinon.spy()
        send: sinon.spy()
      }
    }
    @deviceData = {
      data: true,
      id: "deviceId",
      subTopic: "status"
    }

    @mqtt = new Mqtt(@definition, @env)

  it 'init', ->
    await @mqtt.init()

    sinon.assert.calledOnce(@mqttDev.connect)
    sinon.assert.calledWith(@mqttDev.connect, @props)
    sinon.assert.calledOnce(@mqttDevConnection.onMessage)
    sinon.assert.calledOnce(@env.messenger.subscribeCategory)
    sinon.assert.calledWith(@env.messenger.subscribeCategory, 'master', 'externalDataOutcome')

  it 'messagesHandler', ->
    await @mqtt.messagesHandler('deviceId/status', 'true')

    sinon.assert.calledOnce(@env.messenger.send)
    sinon.assert.calledWith(@env.messenger.send, 'master', 'externalDataIncome', 'deviceId', @deviceData)

  it 'hostPublishHandler', ->
    await @mqtt.init()
    await @mqtt.hostPublishHandler('master', @deviceData)

    sinon.assert.calledOnce(@mqttDevConnection.publish)
    sinon.assert.calledWith(@mqttDevConnection.publish, 'deviceId/status', true)
