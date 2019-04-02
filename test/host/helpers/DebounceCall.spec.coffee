DebounceCall = require('../../../host/helpers/DebounceCall').default;


describe.only 'helpers.DebounceCall', ->
  beforeEach ->
    @id = 'myId'
    @cb1 = sinon.spy()
    @cb2 = sinon.spy()
    @debounceCall = new DebounceCall()

  it "invoke", ->
    clock = sinon.useFakeTimers()

    @debounceCall.invoke(@id, 1000, @cb1)
    @debounceCall.invoke(@id, 1000, @cb2)

    clock.tick(1000)

    sinon.assert.notCalled(@cb1)
    sinon.assert.calledOnce(@cb2)

    clock.restore()
