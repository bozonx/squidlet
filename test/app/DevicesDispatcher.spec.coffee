DevicesDispatcher = require('../../src/app/DevicesDispatcher').default


describe 'app.DevicesDispatcher', ->
  beforeEach ->
    @requestSubscribeCb = undefined
    @app = {
      messenger: {
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

    # TODO: WTF???

    @requestSubscribeCb({
      payload: {
        statusName: 'temperature'
        partialStatus: { data: 1 }
      }
    })

    sinon.assert.calledWith(handler, '', {})
