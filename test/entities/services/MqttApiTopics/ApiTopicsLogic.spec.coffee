ApiTopicsLogic = require('../../../../entities/services/MqttApiTopics/ApiTopicsLogic').default


describe.only 'services.MqttApiTopics.ApiTopicsLogic', ->
  beforeEach ->
    @apiManager = {
      callApi: sinon.stub().returns(Promise.resolve())
    }
    @context = {
      system: {
        apiManager: @apiManager
      }
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

  it 'incomeMessage - api with params', ->
    @logic.incomeMessage('prfx/api/methodName', '1,param1,true, [5, "str"]')

    sinon.assert.calledOnce(@apiManager.callApi)
    sinon.assert.calledWith(@apiManager.callApi, 'methodName', [1, 'param1', true, [5, "str"]])
