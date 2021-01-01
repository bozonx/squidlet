ApiTopicsLogic = require('../../../../../../squidlet-networking/src/bridges/__old/MqttApiTopics/ApiTopicsLogic').default


describe 'services.MqttApiTopics.ApiTopicsLogic', ->
  beforeEach ->
    @apiManager = {
      callApi: sinon.stub().returns(Promise.resolve())
      getMethodNames: () => ['reboot', 'updater.update']
    }
    @devicesManager = {
      getIds: () => ['room1.device1', 'room2.device2']
      getDevice: () =>
        {
          getActionsList: () => ['turn', 'toggle']
        }
    }
    @state = {
      getState: () => { temperature: 30, default: 'value' }
    }
    @context = {
      system: {
        apiManager: @apiManager
        devicesManager: @devicesManager
      }
      state: @state
      log: {
        debug: () =>
      }
    }
    @prefix = 'prfx'
    @logic = new ApiTopicsLogic(@context, @prefix)

  it 'incomeMessage - api without params', ->
    @logic.incomeMessage('prfx/api/reboot')

    sinon.assert.calledOnce(@apiManager.callApi)
    sinon.assert.calledWith(@apiManager.callApi, 'reboot', [])

  it 'incomeMessage - api without prefix', ->
    @logic.prefix = undefined
    @logic.incomeMessage('api/reboot')

    sinon.assert.calledOnce(@apiManager.callApi)
    sinon.assert.calledWith(@apiManager.callApi, 'reboot', [])

  it 'incomeMessage - api with params', ->
    @logic.incomeMessage('prfx/api/methodName', '1,param1,true, [5, "str"]')

    sinon.assert.calledOnce(@apiManager.callApi)
    sinon.assert.calledWith(@apiManager.callApi, 'methodName', [1, 'param1', true, [5, "str"]])

  it 'incomeMessage - call action', ->
    @logic.incomeMessage('prfx/action/deviceId/actionName', '1,param1')

    sinon.assert.calledOnce(@apiManager.callApi)
    sinon.assert.calledWith(@apiManager.callApi, 'action', ['deviceId', 'actionName', 1, 'param1'])

  it 'incomeMessage - call action without prefix', ->
    @logic.prefix = undefined
    @logic.incomeMessage('action/deviceId/actionName', '1,param1')

    sinon.assert.calledOnce(@apiManager.callApi)
    sinon.assert.calledWith(@apiManager.callApi, 'action', ['deviceId', 'actionName', 1, 'param1'])

  it 'incomeMessage - wrong prefix', ->
    @logic.incomeMessage('other/action/deviceId/actionName', '1,param1')

    sinon.assert.notCalled(@apiManager.callApi)

  it 'incomeMessage - incorrect topic', ->
    @logic.incomeMessage('other/other')

    sinon.assert.notCalled(@apiManager.callApi)

  it 'incomeMessage - wrong type', ->
    @logic.incomeMessage('prfx/api1/methodName')

    sinon.assert.notCalled(@apiManager.callApi)

  it 'getTopicsToSubscribe', ->
    assert.deepEqual(@logic.getTopicsToSubscribe(), [
      'prfx/action/room1.device1/turn'
      'prfx/action/room1.device1/toggle'
      'prfx/action/room2.device2/turn'
      'prfx/action/room2.device2/toggle'
      'prfx/api/reboot'
      'prfx/api/updater.update'
    ])

  it 'handleStateChange - status', ->
    handler = sinon.spy()

    @logic.onOutcome(handler)
    @logic.handleStateChange(0, 'room1.device1', ['temperature'])

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, 'prfx/status/room1.device1/temperature', '30')

  it 'handleStateChange - default status', ->
    handler = sinon.spy()

    @logic.onOutcome(handler)

    @logic.handleStateChange(0, 'room1.device1', ['default'])

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, 'prfx/status/room1.device1', 'value')

  it 'handleStateChange - config', ->
    handler = sinon.spy()

    @logic.onOutcome(handler)

    @logic.handleStateChange(1, 'room1.device1', ['default'])

    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, 'prfx/config/room1.device1', 'value')

  it 'handleStateChange - wrong category', ->
    handler = sinon.spy()

    @logic.onOutcome(handler)

    @logic.handleStateChange(2, 'room1.device1', ['default'])

    sinon.assert.notCalled(handler)

  it 'handleStateChange - no state', ->
    @state.getState = () => undefined
    handler = sinon.spy()

    @logic.onOutcome(handler)

    @logic.handleStateChange(0, 'room1.device1', ['default'])

    sinon.assert.notCalled(handler)
