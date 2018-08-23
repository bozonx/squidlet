BinarySensor = require('../../src/devices/BinarySensor/BinarySensor').default


describe 'devices.BinarySensor', ->
  beforeEach ->
    @getLevelResult = Promise.resolve(0)
    @driver = {
      getLevel: => @getLevelResult
      onChange: =>
      #getLevel: sinon.stub().returns(Promise.resolve(1))
    }
    @system = {
      drivers: {
        getDriver: => {
          getInstance: => @driver
        }
      }
      host: {
        config: {
          host: {
            defaultStatusRepublishIntervalMs: 0
          }
        }
      }
    }
    @deviceConf = {
      deviceId: 'room1.device1'
      manifest: {
        status: {
          default: {
            type: 'number'
          }
        }
      }
      props: {
        debounceTime: 20
        deadTime: 50
      }
    }
    @handleStatusChange = sinon.spy()
    @binarySensor = new BinarySensor(@system, @deviceConf)
    @binarySensor.publish = sinon.spy()
    @binarySensor.onChange(@handleStatusChange)
    @binarySensor.init()

  it "main logic", ->
    assert.equal(@binarySensor.status.getLocal().default, 0)

    @getLevelResult = Promise.resolve(1)
    clock = sinon.useFakeTimers()



    # like driver has risen an event
    @binarySensor.onInputChange()

    assert.isTrue(@binarySensor.debounceInProgress)
    assert.isFalse(@binarySensor.deadTimeInProgress)

    # wait for debounce time has finished and startValueLogic has started
    clock.tick(20)

    assert.isFalse(@binarySensor.debounceInProgress)
    assert.isTrue(@binarySensor.deadTimeInProgress)

    await @getLevelResult

    # after setStatus
    assert.equal(@binarySensor.status.getLocal().default, 1)

    sinon.assert.calledTwice(@handleStatusChange);
    sinon.assert.calledWith(@handleStatusChange, ['default']);

    clock.tick(50)

    assert.isFalse(@binarySensor.debounceInProgress)
    assert.isFalse(@binarySensor.deadTimeInProgress)

    clock.restore()

    sinon.assert.calledTwice(@binarySensor.publish)
    sinon.assert.calledWith(@binarySensor.publish, 'status', 0)
    sinon.assert.calledWith(@binarySensor.publish, 'status', 1)
