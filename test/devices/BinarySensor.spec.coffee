BinarySensor = require('../../src/devices/BinarySensor/BinarySensor').default


describe.only 'devices.BinarySensor', ->
  beforeEach ->
    @getResult = 1
    @driver = {
      getLevel: => @result
      #getLevel: sinon.stub().returns(Promise.resolve(1))
    }
    @system = {
      drivers: {
        getDriver: => @driver
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
    }
    @binarySensor = new BinarySensor(@system, @deviceConf)
    @binarySensor.publish = sinon.spy()

  it 'init', ->
    # TODO: !!!!

  it 'listen changes', ->


  it "$handleBinaryStatusChange", ->
    @binarySensor.init()
    clock = sinon.useFakeTimers()

    getLevelPromise = Promise.resolve(1)
    @binarySensor.gpioInputSensor.getGpioLevel = sinon.stub().returns(getLevelPromise)
    handleStatusChange = sinon.spy()
    @binarySensor.statusCtl.onChange(handleStatusChange)

    @binarySensor.$handleBinaryStatusChange(1)

    assert.isTrue(@binarySensor._debounceInProgress)
    assert.isFalse(@binarySensor._deadTimeInProgress)

    clock.tick(20)

    assert.isFalse(@binarySensor._debounceInProgress)
    assert.isTrue(@binarySensor._deadTimeInProgress)

    getLevelPromise.then =>
      assert.equal(@binarySensor.statusCtl.getLastStatus(), 1)

      sinon.assert.calledOnce(handleStatusChange);
      sinon.assert.calledWith(handleStatusChange, 'path/to/status', 1, { isRepeat: false });

      clock.tick(20)

      assert.isFalse(@binarySensor._debounceInProgress)
      assert.isFalse(@binarySensor._deadTimeInProgress)

      clock.restore()
