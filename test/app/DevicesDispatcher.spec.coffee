DevicesDispatcher = require('../../src/app/DevicesDispatcher').default


describe.only 'app.DevicesDispatcher', ->
  beforeEach ->
    @requestSubscribeCb = undefined
    @app = {
      host: {
        id: 'master'
      }
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

  it 'listenStatuses', ->
    handler = sinon.spy()
    @devicesDispatcher.listenStatuses(@deviceId, handler)

    @requestSubscribeCb({
      payload: { temperature: 25 }
    })

    sinon.assert.calledWith(handler, { temperature: 25 })

  it 'listenConfig', ->
    handler = sinon.spy()
    @devicesDispatcher.listenConfig(@deviceId, handler)

    @requestSubscribeCb({
      payload: { param: 1 }
    })

    sinon.assert.calledWith(handler, { param: 1 })

  it 'publishStatus', ->
    await @devicesDispatcher.publishStatus(@deviceId, 'temperature', 25)

    sinon.assert.calledWith(@app.messenger.publish,
      'master',
      'deviceFeedBack',
      'room/host1$device1/status/temperature',
      25
    )

  it 'publishConfig', ->
    await @devicesDispatcher.publishConfig(@deviceId, { param: 1 })

    sinon.assert.calledWith(@app.messenger.publish,
      'master',
      'deviceFeedBack',
      'room/host1$device1/config',
      { param: 1 }
    )

  it 'private callLocalDeviceAction', ->
    device = {
      turn: sinon.stub().returns(Promise.resolve('result'))
    }
    @app.devices = {
      getDevice: -> device
    }
    request = {
      topic: 'room/host1$device1/turn'
      payload: [123]
    }

    result = await @devicesDispatcher.callLocalDeviceAction(request)

    assert.equal(result, 'result')
    sinon.assert.calledWith(device.turn, 123)
