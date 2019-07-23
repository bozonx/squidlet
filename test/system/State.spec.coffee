State = require('../../system/State').default


describe.only 'system.State', ->
  beforeEach ->
    @category = 0
    @stateName = 'deviceId'
    @partialState = { param: 'value' }
    @state = new State()

  it 'updateState, getState, onChange - ordinary state change', ->
    handler = sinon.spy()
    @state.onChange(handler)
    @state.updateState(@category, @stateName, @partialState)

    assert.deepEqual(@state.getState(@category, @stateName), @partialState)
    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, ['param'])

  # TODO: проверить накладывание в updateState
  # TODO: listen category
  # TODO: param change
  # TODO: removeListener
  # TODO: removeParamListener
