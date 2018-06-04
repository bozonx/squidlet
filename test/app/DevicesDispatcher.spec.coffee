DevicesDispatcher = require('../../src/app/DevicesDispatcher').default


describe.only 'app.DevicesDispatcher', ->
  beforeEach ->
    @requestSubscribeCb = undefined
    @app = {
      messenger: {
        publish: sinon.stub().returns(Promise.resolve())
        request: sinon.stub().returns(Promise.resolve())
        subscribe: (category, topic, cb) => @requestSubscribeCb = cb
      }
    }

    @deviceId = 'room1.device1'

    @devicesDispatcher = new DevicesDispatcher(@app)

  it 'callAction', ->
    to = {
      host: @deviceId
      type: 'i2c'
      bus: 1
      address: '5a'
    }
    @devicesDispatcher.resolveHost = -> to
    await @devicesDispatcher.callAction(@deviceId, 'turn', 1)

    sinon.assert.calledWith(@app.messenger.request, to, 'deviceCallAction', 'room1.device1/turn', [1])

  it 'listenStatus', ->
    handler = sinon.spy()
    @devicesDispatcher.listenStatus(@deviceId, handler)

    @requestSubscribeCb({
      payload: {
        status: 'temperature'
        value: 1
      }
    })

    sinon.assert.calledWith(handler, 'temperature', 1)

  it 'publishStatus', ->
    to = {
      host: 'master'
      type: 'i2c'
      bus: 1
      address: undefined
    }
    @devicesDispatcher.resolveHost = -> to

    @devicesDispatcher.publishStatus(@deviceId, 'temperature', 25)

    sinon.assert.calledWith(@app.messenger.publish, to, 'deviceFeedBack', 'status', {
      status: 'temperature'
      value: 25
    })
