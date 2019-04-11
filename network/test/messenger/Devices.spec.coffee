Devices = require('../../plugin-bridge/Devices').default


describe 'app.Devices', ->
  beforeEach ->
    @requestSubscribeCb = undefined
    @system = {
      host: {
        id: 'master'
      }
      messenger: {
        publish: sinon.stub().returns(Promise.resolve())
        request: sinon.stub().returns(Promise.resolve())
        subscribe: (toHost, topic, cb) => @requestSubscribeCb = cb
      }
    }

    @hostId = 'room/host1'
    @deviceId = 'room/host1$device1'
    @devices = new Devices(@system)

  it 'callAction', ->
    await @devices.callAction(@deviceId, 'turn', 1)

    sinon.assert.calledWith(@system.messenger.request,
      @hostId,
      'deviceCallAction',
      { actionName: 'turn', deviceId: @deviceId, params: [1] }
    )

  it 'setConfig', ->
    await @devices.setConfig(@deviceId, { param: 1 })

    sinon.assert.calledWith(
      @system.messenger.request,
      @hostId,
      'deviceCallAction',
      { actionName: 'setConfig', deviceId: @deviceId, params: [{ param: 1 }] }
    )

  it 'listenStatus', ->
    handler = sinon.spy()
    @devices.listenStatus(@deviceId, 'temperature', handler)

    @requestSubscribeCb({
      actionName: 'status'
      statusName: 'temperature'
      deviceId: @deviceId
      value: 25
    })

    sinon.assert.calledWith(handler, 25)

  it 'listenConfig', ->
    handler = sinon.spy()
    @devices.listenConfig(@deviceId, handler)

    @requestSubscribeCb({
      actionName: 'config'
      deviceId: @deviceId
      config: { param: 1 }
    })

    sinon.assert.calledWith(handler, { param: 1 })

  it 'publishStatus', ->
    await @devices.publishStatus(@deviceId, 'temperature', 25)

    sinon.assert.calledWith(@system.messenger.publish,
      'master',
      'deviceFeedBack',
      {
        actionName: 'status'
        deviceId: @deviceId
        statusName: 'temperature'
        value: 25
      }
    )

  it 'publishConfig', ->
    await @devices.publishConfig(@deviceId, { param: 1 })

    sinon.assert.calledWith(@system.messenger.publish,
      'master',
      'deviceFeedBack',
      { actionName: 'config', config: { param: 1 }, deviceId: @deviceId }
    )

  it 'private callLocalDeviceAction', ->
    device = {
      action: sinon.stub().returns(Promise.resolve('result'))
      actions: {
        turn: =>
      }
    }
    @system.devicesManager = {
      getDevice: -> device
    }
    request = {
      topic: 'room/host1$device1/turn'
      payload: {
        deviceId: @deviceId
        actionName: 'turn'
        params: [123]
      }
    }

    result = await @devices.callLocalDeviceAction(request)

    assert.equal(result, 'result')
    sinon.assert.calledWith(device.action, 'turn', 123)
