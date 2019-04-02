Republish = require('../../../host/helpers/Republish').default;


describe.only 'helpers.Republish', ->
  beforeEach ->

  it "start and stop", ->
    handler = sinon.spy()
    republish = new Republish(10000)

    republish.start(handler)

    sinon.assert.notCalled(handler)

    assert.isFalse(typeof republish.intervalId == 'undefined')

    republish.stop()

    assert.isTrue(typeof republish.intervalId == 'undefined')
