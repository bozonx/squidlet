State = require('../../../system/lib/State').default


describe.only 'system.lib.State', ->
  beforeEach ->
    @category = 0
    @stateName = 'deviceId'
    @partialState = { param: 'value' }
    @state = new State()

  it 'updateState, getState, onChange - ordinary state change', ->
    handler = sinon.spy()
    paramHandler = sinon.spy()
    @state.onChange(handler)
    @state.onChangeParam(paramHandler)

    @state.updateState(@category, @stateName, @partialState)

    assert.deepEqual(@state.getState(@category, @stateName), @partialState)
    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, @category, @stateName, ['param'])
    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(paramHandler, @category, @stateName, 'param', 'value')

  it 'updateStateParam, getStateParam, onChangeParam - change state param', ->
    handler = sinon.spy()
    paramHandler = sinon.spy()
    @state.onChange(handler)
    @state.onChangeParam(paramHandler)

    @state.updateStateParam(@category, @stateName, 'param', 'value')

    assert.deepEqual(@state.getState(@category, @stateName), @partialState)
    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(handler, @category, @stateName, ['param'])
    sinon.assert.calledOnce(handler)
    sinon.assert.calledWith(paramHandler, @category, @stateName, 'param', 'value')

  it 'updateState - dont rise event if value doesnt changed', ->
    handler = sinon.spy()
    paramHandler = sinon.spy()
    @state.onChange(handler)
    @state.onChangeParam(paramHandler)
    @state.state = {
      '0': {
        deviceId: @partialState
      }
    }

    @state.updateState(@category, @stateName, @partialState)

    sinon.assert.notCalled(handler)
    sinon.assert.notCalled(paramHandler)

  it 'updateState - overwrite previous value', ->
    @state.state = {
      '0': {
        deviceId: {
          param: 'value old'
          param2: 'not changed'
        }
      }
    }

    @state.updateState(@category, @stateName, @partialState)

    assert.deepEqual(@state.getState(@category, @stateName), {
      param: 'value'
      param2: 'not changed'
    })

  it 'updateState - set param to undefined', ->
    @state.state = {
      '0': {
        deviceId: {
          param: 'value old'
          param2: 'not changed'
        }
      }
    }

    @state.updateState(@category, @stateName, {param: undefined})

    assert.deepEqual(@state.getState(@category, @stateName), {
      param: undefined
      param2: 'not changed'
    })

  it 'updateStateParam - dont rise event if value doesnt changed', ->
    handler = sinon.spy()
    paramHandler = sinon.spy()
    @state.onChange(handler)
    @state.onChangeParam(paramHandler)
    @state.state = {
      '0': {
        deviceId: @partialState
      }
    }

    @state.updateStateParam(@category, @stateName, 'param', 'value')

    sinon.assert.notCalled(handler)
    sinon.assert.notCalled(paramHandler)

  it 'updateStateParam - overwrite previous value', ->
    @state.state = {
      '0': {
        deviceId: {
          param: 'value old'
          param2: 'not changed'
        }
      }
    }

    @state.updateStateParam(@category, @stateName, 'param', 'value')

    assert.deepEqual(@state.getState(@category, @stateName), {
      param: 'value'
      param2: 'not changed'
    })

  it 'updateStateParam - set param to undefined obviously', ->
    @state.state = {
      '0': {
        deviceId: {
          param: 'value old'
          param2: 'not changed'
        }
      }
    }

    @state.updateStateParam(@category, @stateName, 'param', undefined)

    assert.deepEqual(@state.getState(@category, @stateName), {
      param: undefined
      param2: 'not changed'
    })

  it 'removeListener', ->
    handler = sinon.spy()
    handlerIndex = @state.onChange(handler)

    @state.removeListener(handlerIndex)

    @state.updateState(@category, @stateName, @partialState)

    sinon.assert.notCalled(handler)

  it 'removeParamListener', ->
    handler = sinon.spy()
    handlerIndex = @state.onChangeParam(handler)

    @state.removeParamListener(handlerIndex)

    @state.updateStateParam(@category, @stateName, 'param', 'value')

    sinon.assert.notCalled(handler)

  it 'destroy', ->
    @state.onChange(sinon.spy())
    @state.onChangeParam(sinon.spy())

    @state.destroy()

    assert.isFalse(@state.changeEvents.hasListeners())
    assert.isFalse(@state.changeParamEvents.hasListeners())
