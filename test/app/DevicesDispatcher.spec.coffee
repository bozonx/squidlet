DevicesDispatcher = require('../../src/app/DevicesDispatcher').default


describe.only 'app.DevicesDispatcher', ->
  beforeEach ->
    @requestSubscribeCb = undefined
    @app = {
      messenger: {
        publish: sinon.stub().returns(Promise.resolve())
        request: sinon.stub().returns(Promise.resolve())
        subscribe: (toHost, category, topic, cb) => @requestSubscribeCb = cb
      }
    }

    @hostId = 'room/host1'
    @deviceId = 'room/host1$device1'
    @devicesDispatcher = new DevicesDispatcher(@app)

  it 'callAction', ->
    await @devicesDispatcher.callAction(@deviceId, 'turn', 1)

    sinon.assert.calledWith(
      @app.messenger.request,
      @hostId,
      'deviceCallAction',
      'room/host1$device1/turn',
      [1]
    )

  it 'setConfig', ->
    await @devicesDispatcher.setConfig(@deviceId, { param: 1 })

    sinon.assert.calledWith(
      @app.messenger.request,
      @hostId,
      'deviceCallAction',
      'room/host1$device1/setConfig',
      [{ param: 1 }]
    )

  it 'listenStatus', ->
    handler = sinon.spy()
    @devicesDispatcher.listenStatus(@deviceId, 'temperature', handler)

    @requestSubscribeCb({
      payload: 25
    })

    sinon.assert.calledWith(handler, 25)

#  it 'publishStatus', ->
#    to = {
#      host: 'master'
#      type: 'i2c'
#      bus: 1
#      address: undefined
#    }
#    @devicesDispatcher.resolveHost = -> to
#
#    @devicesDispatcher.publishStatus(@deviceId, 'temperature', 25)
#
#    sinon.assert.calledWith(@app.messenger.publish, to, 'deviceFeedBack', 'status', {
#      status: 'temperature'
#      value: 25
#    })
