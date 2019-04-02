Republish = require('../../../host/helpers/Republish').default;


describe 'helpers.Republish', ->
  it "start", ->
    clock = sinon.useFakeTimers()
    handler = sinon.spy()
    republish = new Republish(1000)

    republish.start(handler)

    sinon.assert.notCalled(handler)

    clock.tick(1000)

    sinon.assert.calledOnce(handler)

    clock.restore()
    republish.stop()

  it "stop", ->
    handler = sinon.spy()
    republish = new Republish(1000)

    republish.start(handler)

    sinon.assert.notCalled(handler)

    assert.isFalse(typeof republish.intervalId == 'undefined')

    republish.stop()

    assert.isTrue(typeof republish.intervalId == 'undefined')
